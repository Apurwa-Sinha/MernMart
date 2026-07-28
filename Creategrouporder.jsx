import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DeleteIcon from '@material-ui/icons/Delete';

const API = process.env.REACT_APP_API_URL || '';

const getUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('jwt'));
    return stored && stored.user ? stored.user._id : null;
  } catch (e) {
    return null;
  }
};

const getToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('jwt'));
    return stored ? stored.token : null;
  } catch (e) {
    return null;
  }
};

/**
 * @param {Array<{_id, name, price, count}>} cartItems - the items being split
 * @param {string} address - shipping address for the eventual order
 */
const CreateGroupOrder = ({ cartItems = [], address = '' }) => {
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cartItems.reduce((sum, item) => sum + item.price * item.count, 0);

  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    if (!/.+@.+\..+/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    if (emails.includes(trimmed)) {
      setError('That email is already added');
      return;
    }
    setEmails([...emails, trimmed]);
    setEmailInput('');
    setError('');
  };

  const removeEmail = (email) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleCreate = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }
    if (emails.length === 0) {
      setError('Add at least one person to split the bill with');
      return;
    }

    const userId = getUserId();
    const token = getToken();
    if (!userId || !token) {
      setError('Please sign in to start a group order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/group-order/create/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          products: cartItems,
          participantEmails: emails,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not create group order');
      } else {
        setShareLink(data.shareLink);
      }
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (shareLink) {
    return (
      <Paper style={{ padding: 24 }}>
        <Typography variant="h6" gutterBottom>
          Group order started!
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Share this link with everyone splitting the bill. The order ships
          once everyone has paid their share.
        </Typography>
        <Box display="flex" alignItems="center" mt={2}>
          <TextField
            value={shareLink}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{ readOnly: true }}
          />
          <IconButton onClick={handleCopy} color="primary">
            <FileCopyIcon />
          </IconButton>
        </Box>
        {copied && (
          <Typography variant="caption" color="primary">
            Copied to clipboard
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h6" gutterBottom>
        Split the bill
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Total: ${total.toFixed(2)} across {emails.length + 1}{' '}
        {emails.length + 1 === 1 ? 'person' : 'people'} = $
        {(total / (emails.length + 1)).toFixed(2)} each (approx.)
      </Typography>

      <Box display="flex" mt={2}>
        <TextField
          label="Participant email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyPress={handleKeyPress}
          fullWidth
          size="small"
          variant="outlined"
        />
        <IconButton onClick={addEmail} color="primary">
          <AddIcon />
        </IconButton>
      </Box>

      {emails.length > 0 && (
        <List dense>
          {emails.map((email) => (
            <ListItem key={email}>
              <ListItemText primary={email} />
              <IconButton size="small" onClick={() => removeEmail(email)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}

      {error && (
        <Typography variant="body2" color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleCreate}
        disabled={loading}
        fullWidth
      >
        {loading ? 'Creating...' : 'Create group order & get link'}
      </Button>
    </Paper>
  );
};

export default CreateGroupOrder;
