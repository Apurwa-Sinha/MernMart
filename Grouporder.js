const crypto = require('crypto');
const braintree = require('braintree');
const GroupOrder = require('../models/groupOrder');
const { Order } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');
require('dotenv').config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Production
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

const GROUP_ORDER_EXPIRY_DAYS = 7;

/**
 * Starts a group order. The initiator picks products and a list of
 * participant emails; the total is split evenly (remainder cents go to
 * the initiator's share so amounts always sum exactly to the total).
 * Returns a shareable link each participant can use to pay their share.
 *
 * Expects req.body: { products: [{ _id, name, price, count }], participantEmails: string[], address }
 */
exports.createGroupOrder = async (req, res) => {
  try {
    const { products, participantEmails, address } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }
    if (!participantEmails || participantEmails.length === 0) {
      return res.status(400).json({
        error: 'Add at least one other participant to split the bill with',
      });
    }

    const totalAmount = products.reduce(
      (sum, p) => sum + p.price * p.count,
      0
    );

    const otherCount = participantEmails.length;
    const totalParticipants = otherCount + 1; // + the initiator
    const rawShare = Math.floor((totalAmount / totalParticipants) * 100) / 100;

    const otherParticipants = participantEmails.map((email) => ({
      email,
      shareAmount: rawShare,
      paid: false,
      isInitiator: false,
    }));

    // initiator's share absorbs whatever rounding remainder is left over,
    // so the shares always add up to exactly totalAmount
    const remainder =
      Math.round((totalAmount - rawShare * otherCount) * 100) / 100;

    const initiatorParticipant = {
      email: req.profile.email,
      shareAmount: remainder,
      paid: false,
      isInitiator: true,
    };

    const shareToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(
      Date.now() + GROUP_ORDER_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const groupOrder = new GroupOrder({
      initiator: req.profile._id,
      products,
      totalAmount,
      address,
      shareToken,
      expiresAt,
      participants: [initiatorParticipant, ...otherParticipants],
    });

    const saved = await groupOrder.save();

    const clientUrl = process.env.CLIENT_URL || '';
    res.json({
      groupOrder: saved,
      shareLink: `${clientUrl}/group-order/${shareToken}`,
    });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

/**
 * Public lookup by share token — lets an invited participant (who may
 * not even have an account) see what they're being asked to pay before
 * entering payment details.
 */
exports.getGroupOrderByToken = async (req, res) => {
  try {
    const groupOrder = await GroupOrder.findOne({
      shareToken: req.params.token,
    }).populate('products.product', 'name price');

    if (!groupOrder) {
      return res.status(404).json({ error: 'Group order not found' });
    }

    if (groupOrder.status === 'pending' && groupOrder.expiresAt < new Date()) {
      groupOrder.status = 'expired';
      await groupOrder.save();
    }

    res.json(groupOrder);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

/**
 * A single participant pays their share. When the last unpaid
 * participant pays, the group order is marked completed and the real
 * Order record is created for fulfillment.
 *
 * Expects req.body: { email, paymentMethodNonce }
 */
exports.payShare = async (req, res) => {
  try {
    const { email, paymentMethodNonce } = req.body;
    const groupOrder = await GroupOrder.findOne({
      shareToken: req.params.token,
    });

    if (!groupOrder) {
      return res.status(404).json({ error: 'Group order not found' });
    }

    if (groupOrder.status === 'expired' || groupOrder.expiresAt < new Date()) {
      groupOrder.status = 'expired';
      await groupOrder.save();
      return res.status(400).json({ error: 'This group order has expired' });
    }

    if (groupOrder.status !== 'pending') {
      return res.status(400).json({
        error: 'This group order is no longer accepting payments',
      });
    }

    const participant = groupOrder.participants.find(
      (p) => p.email === email && !p.paid
    );

    if (!participant) {
      return res.status(400).json({
        error: 'No unpaid share found for this email on this group order',
      });
    }

    gateway.transaction.sale(
      {
        amount: participant.shareAmount.toFixed(2),
        paymentMethodNonce,
        options: { submitForSettlement: true },
      },
      async (error, result) => {
        if (error || !result.success) {
          console.log('GROUP ORDER PAYMENT FAILED', error || result.message);
          return res.status(400).json({
            error: 'Payment could not be processed for your share',
          });
        }

        try {
          participant.paid = true;
          participant.transactionId = result.transaction.id;
          participant.paidAt = new Date();

          const allPaid = groupOrder.participants.every((p) => p.paid);

          if (allPaid) {
            groupOrder.status = 'completed';

            const finalOrder = new Order({
              products: groupOrder.products,
              amount: groupOrder.totalAmount,
              address: groupOrder.address,
              user: groupOrder.initiator,
              transaction_id: groupOrder.participants
                .map((p) => p.transactionId)
                .join(','),
            });
            const savedOrder = await finalOrder.save();
            groupOrder.finalOrder = savedOrder._id;
          }

          await groupOrder.save();

          res.json({
            success: true,
            groupOrderStatus: groupOrder.status,
          });
        } catch (saveErr) {
          // the charge succeeded but we failed to persist the update —
          // this needs manual reconciliation rather than silently
          // telling the participant their payment didn't go through
          console.log(
            'CRITICAL: payment succeeded but group order update failed',
            saveErr
          );
          return res.status(500).json({
            error:
              'Your payment succeeded, but we had trouble recording it. Please contact support.',
          });
        }
      }
    );
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

/**
 * Lets the initiator (or an admin) cancel a still-pending group order,
 * e.g. if it's taking too long or plans changed. Already-paid
 * participants are not automatically refunded here — that's a manual
 * step via the Braintree dashboard/API, flagged rather than assumed.
 */
exports.cancelGroupOrder = async (req, res) => {
  try {
    const groupOrder = await GroupOrder.findOne({
      shareToken: req.params.token,
    });

    if (!groupOrder) {
      return res.status(404).json({ error: 'Group order not found' });
    }

    if (String(groupOrder.initiator) !== String(req.profile._id)) {
      return res.status(403).json({
        error: 'Only the person who started this group order can cancel it',
      });
    }

    if (groupOrder.status !== 'pending') {
      return res.status(400).json({
        error: 'Only a pending group order can be cancelled',
      });
    }

    groupOrder.status = 'cancelled';
    await groupOrder.save();

    res.json({ message: 'Group order cancelled' });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};
