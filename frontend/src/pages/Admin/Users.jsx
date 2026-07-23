import { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Filter, Edit2, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../context';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ size: 100 });
      const fetchedUsers = response.data.items.map(u => ({
        id: u.id,
        name: u.full_name || 'Unknown',
        email: u.email,
        role: u.role,
        status: u.is_active ? 'active' : 'inactive',
        joinDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : 'N/A',
      }));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    const colors = {
      contributor: 'purple',
      recipient: 'orange',
      volunteer: 'blue',
      admin: 'red',
    };
    return colors[role] || 'gray';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'secondary';
  };

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h1 className="admin-title">
          <UsersIcon size={24} />
          Users Management
        </h1>
        <p className="admin-subtitle">Manage all users in the system</p>
      </div>

      <Card className="users-filter">
        <div className="filter-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-filter"
          >
            <option value="all">All Roles</option>
            <option value="contributor">Contributors</option>
            <option value="recipient">Recipients</option>
            <option value="volunteer">Volunteers</option>
          </select>
        </div>
      </Card>

      <Card className="users-table-card">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <Badge color={getRoleColor(u.role)}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <Badge color={getStatusColor(u.status)}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </Badge>
                  </td>
                  <td>{u.joinDate}</td>
                  <td className="actions-cell">
                    <button className="action-btn" title="View">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn danger" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Users;
