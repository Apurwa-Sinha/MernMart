import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper } from '@material-ui/core';

/**
 * IMPORTANT: These are structural templates, not legal advice. They
 * cover the standard sections a real policy needs, but the specific
 * wording, data-retention periods, jurisdiction, and liability terms
 * MUST be reviewed by an actual lawyer before this is relied on for a
 * real business handling real customer data and payments.
 */

const COMPANY_NAME = 'Vantage Cart';
const CONTACT_EMAIL = 'support@example.com'; // replace with your real support email
const LAST_UPDATED = 'July 2026'; // update whenever the policy text changes

const PrivacyPolicy = () => (
  <>
    <Typography variant="h5" gutterBottom>Privacy Policy</Typography>
    <Typography variant="body2" color="textSecondary" gutterBottom>
      Last updated: {LAST_UPDATED}
    </Typography>

    <Typography variant="h6" style={{ marginTop: 24 }}>1. Information we collect</Typography>
    <Typography variant="body2" paragraph>
      When you create an account, we collect your name, email address, and a
      hashed (never plain-text) version of your password. When you place an
      order, we collect a shipping address and, via our payment processor
      (Braintree), process payment details — we never store your full card
      number on our own servers.
    </Typography>

    <Typography variant="h6">2. How we use it</Typography>
    <Typography variant="body2" paragraph>
      We use your information to process orders, provide personalized
      recommendations (based on products you've viewed or purchased), and
      communicate with you about your account and orders. [FILL IN: specify
      exactly what "personalized recommendations" means for your app — e.g.
      the Style DNA feature — and get explicit consent language reviewed by
      counsel if required in your jurisdiction, e.g. under GDPR.]
    </Typography>

    <Typography variant="h6">3. Third parties we share data with</Typography>
    <Typography variant="body2" paragraph>
      We share payment information with Braintree (PayPal) to process
      transactions. We share product images with Hugging Face's Inference
      API for visual search functionality. We share chat messages with
      Anthropic's API to power the AI stylist feature. [FILL IN: link to
      each third party's own privacy policy, and confirm your data-sharing
      agreements with them meet your legal obligations.]
    </Typography>

    <Typography variant="h6">4. Data retention</Typography>
    <Typography variant="body2" paragraph>
      [FILL IN: how long you retain account data, order history, and any
      AI-derived data like style profiles, after account deletion or
      inactivity.]
    </Typography>

    <Typography variant="h6">5. Your rights</Typography>
    <Typography variant="body2" paragraph>
      You may request access to, correction of, or deletion of your personal
      data at any time by contacting us at {CONTACT_EMAIL}. [FILL IN:
      jurisdiction-specific rights, e.g. GDPR/CCPA, if applicable to your
      user base.]
    </Typography>

    <Typography variant="h6">6. Contact us</Typography>
    <Typography variant="body2" paragraph>
      Questions about this policy can be sent to {CONTACT_EMAIL}.
    </Typography>
  </>
);

const TermsOfService = () => (
  <>
    <Typography variant="h5" gutterBottom>Terms of Service</Typography>
    <Typography variant="body2" color="textSecondary" gutterBottom>
      Last updated: {LAST_UPDATED}
    </Typography>

    <Typography variant="h6" style={{ marginTop: 24 }}>1. Acceptance of terms</Typography>
    <Typography variant="body2" paragraph>
      By creating an account or making a purchase on {COMPANY_NAME}, you
      agree to these terms.
    </Typography>

    <Typography variant="h6">2. Accounts</Typography>
    <Typography variant="body2" paragraph>
      You are responsible for maintaining the confidentiality of your
      account credentials and for all activity under your account.
    </Typography>

    <Typography variant="h6">3. Orders and payment</Typography>
    <Typography variant="body2" paragraph>
      All prices are shown in [FILL IN: currency]. Orders are not confirmed
      until payment is successfully processed. We reserve the right to
      cancel any order due to product unavailability, pricing errors, or
      suspected fraud.
    </Typography>

    <Typography variant="h6">4. Group orders</Typography>
    <Typography variant="body2" paragraph>
      When you start a group order, each participant is charged
      individually for their own share. [FILL IN: what happens if a group
      order doesn't reach full payment — refund policy for partial
      payments, timeout behavior, etc. — this should match whatever you
      actually implement, since the current version does not automatically
      refund partial payments if a group order is cancelled.]
    </Typography>

    <Typography variant="h6">5. AI features</Typography>
    <Typography variant="body2" paragraph>
      Product recommendations and stylist chat responses are generated
      automatically and may not always be accurate. They do not constitute
      professional advice of any kind.
    </Typography>

    <Typography variant="h6">6. Limitation of liability</Typography>
    <Typography variant="body2" paragraph>
      [FILL IN: standard limitation-of-liability language — this section in
      particular should not be drafted without a lawyer, since it directly
      affects what you can be held liable for.]
    </Typography>

    <Typography variant="h6">7. Governing law</Typography>
    <Typography variant="body2" paragraph>
      [FILL IN: which jurisdiction's laws govern this agreement.]
    </Typography>
  </>
);

const ReturnPolicy = () => (
  <>
    <Typography variant="h5" gutterBottom>Return Policy</Typography>
    <Typography variant="body2" color="textSecondary" gutterBottom>
      Last updated: {LAST_UPDATED}
    </Typography>

    <Typography variant="h6" style={{ marginTop: 24 }}>1. Return window</Typography>
    <Typography variant="body2" paragraph>
      [FILL IN: e.g. "Items may be returned within 30 days of delivery for
      a full refund, provided they are unused and in original packaging."]
    </Typography>

    <Typography variant="h6">2. How to start a return</Typography>
    <Typography variant="body2" paragraph>
      Contact us at {CONTACT_EMAIL} with your order number to begin a
      return. [FILL IN: whether returns are self-service via the "My
      Orders" page, or handled manually by support — the current app does
      not have a customer-initiated return flow; only admins can mark an
      order as "Returned."]
    </Typography>

    <Typography variant="h6">3. Refunds</Typography>
    <Typography variant="body2" paragraph>
      [FILL IN: refund timeline and method — e.g. "Refunds are issued to
      the original payment method within 5-10 business days of us
      receiving the returned item."]
    </Typography>

    <Typography variant="h6">4. Non-returnable items</Typography>
    <Typography variant="body2" paragraph>
      [FILL IN: any categories excluded from returns.]
    </Typography>

    <Typography variant="h6">5. Return-risk indicator</Typography>
    <Typography variant="body2" paragraph>
      Some product pages display a general indicator of how often items in
      that category are returned, based on aggregate order history. This is
      informational only and does not affect your right to return an
      eligible item under this policy.
    </Typography>
  </>
);

const PAGES = {
  privacy: PrivacyPolicy,
  terms: TermsOfService,
  returns: ReturnPolicy,
};

/**
 * Route as /legal/:page where :page is one of "privacy", "terms", "returns"
 */
const LegalPage = () => {
  const { page } = useParams();
  const PageComponent = PAGES[page];

  if (!PageComponent) {
    return (
      <Container maxWidth="md" style={{ paddingTop: 48 }}>
        <Typography color="error">Page not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Paper style={{ padding: 32 }}>
        <PageComponent />
      </Paper>
    </Container>
  );
};

export default LegalPage;
