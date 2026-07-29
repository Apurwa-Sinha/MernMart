import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  TextField,
  IconButton,
  CircularProgress,
  Box,
  Paper,
  Button,
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import CloseIcon from '@material-ui/icons/Close';
import { getUserId, getToken } from '../helpers/authHelpers';

const API = process.env.REACT_APP_API_URL || '';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newName, setNewName] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API}/api/categories`);
      const data = await response.json();
      if (response.ok) setCategories(data);
      else setError(data.error || 'Could not load categories');
    } catch (err) {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditValue(category.name);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (categoryId) => {
    if (!editValue.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    try {
      const response = await fetch(
        `${API}/api/category/${categoryId}/${getUserId()}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ name: editValue }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not update category');
      } else {
        setCategories(
          categories.map((c) =>
            c._id === categoryId ? { ...c, name: editValue } : c
          )
        );
        setEditingId(null);
      }
    } catch (err) {
      setError('Could not reach the server');
    }
  };

  const handleDelete = async (categoryId) => {
    if (
      !window.confirm(
        'Delete this category? Products in this category will keep a reference to a deleted category, so make sure nothing depends on it first.'
      )
    )
      return;

    try {
      const response = await fetch(
        `${API}/api/category/${categoryId}/${getUserId()}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (response.ok) {
        setCategories(categories.filter((c) => c._id !== categoryId));
      } else {
        const data = await response.json();
        setError(data.error || 'Could not delete category');
      }
    } catch (err) {
      setError('Could not reach the server');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const response = await fetch(
        `${API}/api/category/create/${getUserId()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ name: newName }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not create category');
      } else {
        setCategories([...categories, data.data]);
        setNewName('');
      }
    } catch (err) {
      setError('Could not reach the server');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <Typography variant="h6" gutterBottom>
        Manage categories
      </Typography>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <Paper style={{ padding: 16, marginBottom: 16 }}>
        <form onSubmit={handleCreate}>
          <Box display="flex">
            <TextField
              label="New category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
              variant="outlined"
              fullWidth
            />
            <Button type="submit" color="primary" style={{ marginLeft: 8 }}>
              Add
            </Button>
          </Box>
        </form>
      </Paper>

      <List>
        {categories.map((category) => (
          <ListItem key={category._id} divider>
            {editingId === category._id ? (
              <Box display="flex" alignItems="center" width="100%">
                <TextField
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  size="small"
                  variant="outlined"
                  fullWidth
                  autoFocus
                />
                <IconButton onClick={() => saveEdit(category._id)}>
                  <SaveIcon fontSize="small" color="primary" />
                </IconButton>
                <IconButton onClick={cancelEdit}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                <Typography>{category.name}</Typography>
                <Box>
                  <IconButton size="small" onClick={() => startEdit(category)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(category._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default ManageCategories;
