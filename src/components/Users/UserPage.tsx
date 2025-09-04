import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

type User = {
  id: string;
  name: string;
  email: string;
};

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        email: data.email ?? ''
      } as User;
    });
    setUsers(usersList);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddDialog = () => {
    setEditUser(null);
    setFormName('');
    setFormEmail('');
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditUser(null);
    setFormName('');
    setFormEmail('');
  };

  const handleDialogSave = async () => {
    if (!formName || !formEmail) return;
    if (editUser) {
      // Update in Firestore
      await updateDoc(doc(db, 'users', editUser.id), {
        name: formName,
        email: formEmail,
      });
      setUsers(users.map(u => u.id === editUser.id ? { ...u, name: formName, email: formEmail } : u));
    } else {
      // Create in Auth and Firestore
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formEmail, 'changeme123');
        await addDoc(collection(db, 'users'), {
          name: formName,
          email: formEmail,
          uid: userCredential.user.uid,
        });
        await fetchUsers();
      } catch (error: any) {
        alert(error.message);
        return;
      }
    }
    handleDialogClose();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, position: 'relative' }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                        No users yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => openEditDialog(user)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        onClick={openAddDialog}
      >
        <AddIcon />
      </Fab>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Email"
            value={formEmail}
            onChange={e => setFormEmail(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleDialogSave}>
            {editUser ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserPage;