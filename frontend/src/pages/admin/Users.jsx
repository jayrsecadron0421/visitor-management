import { useEffect, useState } from "react";
import { Edit2, Trash2, X, User, Shield, CheckCircle, XCircle, Plus, Mail, Phone, Lock } from "lucide-react";
import api from "../../api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Initialize form state
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "staff",
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      // Optimistic update (remove from list immediately)
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setIsCreating(false);
    const nameParts = user.full_name?.split(" ") || [];
    setForm({
      first_name: nameParts[0] || "",
      middle_name: nameParts.length === 3 ? nameParts[1] : "",
      last_name: nameParts[nameParts.length - 1] || "",
      email: user.email,
      phone_number: user.phone_number,
      password: "", // Don't show password
      role: user.role,
      is_active: user.is_active,
    });
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingUser(null);
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "",
      role: "staff",
      is_active: true,
    });
  };

  const closeModal = () => {
    setEditingUser(null);
    setIsCreating(false);
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "",
      role: "staff",
      is_active: true,
    });
  };

  const createUser = async (e) => {
    e.preventDefault();
    
    // Validate password for new users
    if (!form.password || form.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      const full_name = [form.first_name, form.middle_name, form.last_name]
        .filter(Boolean)
        .join(" ");
      const payload = { ...form, full_name };
      delete payload.first_name;
      delete payload.middle_name;
      delete payload.last_name;
      const res = await api.post("/admin/users", payload);
      setUsers([...users, res.data]);
      closeModal();
      alert("User created successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to create user";
      alert(errorMsg);
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      const full_name = [form.first_name, form.middle_name, form.last_name]
        .filter(Boolean).join(" ");
      const payload = { ...form, full_name };
      delete payload.first_name;
      delete payload.middle_name;
      delete payload.last_name;
      if (!payload.password) delete payload.password; // <-- apply on payload, not updateData

      await api.put(`/admin/users/${editingUser.id}`, payload);
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, full_name, role: form.role, phone_number: form.phone_number, is_active: form.is_active } 
          : u
      ));
      closeModal();
      alert("User updated successfully!");
    } catch (err) {
      alert("Failed to update user");
    }
  };

  const handleSubmit = (e) => {
    if (isCreating) {
      createUser(e);
    } else {
      updateUser(e);
    }
  };

  // Helper to get initials for avatar
  const getInitials = (name) => name?.charAt(0).toUpperCase() ?? "?";

  // Get role badge color
  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      staff: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      user: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    };
    return badges[role] || badges.user;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-pulse">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-gray-500 mt-1">Manage system access and roles</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-white px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
              Total: {users.length} Users
            </span>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all font-medium"
            >
              <Plus size={18} />
              Add New User
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} className="group hover:bg-gray-50 transition-colors duration-200">
                      
                      {/* Name Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{u.full_name}</div>
                            <div className="text-gray-500 text-xs">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{u.phone_number || "—"}</div>
                      </td>

                      {/* Role Column */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <Shield size={12} />
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(u)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE/EDIT MODAL */}
        {(editingUser || isCreating) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
              
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">
                  {isCreating ? "Create New User" : "Edit User"}
                </h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* First Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      maxLength={35}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                </div>

                {/* Middle Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Middle Name <span className="normal-case text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={form.middle_name}
                      onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                      maxLength={35}
                      placeholder="Enter middle name"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Last Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      maxLength={35}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      maxLength={45}
                      placeholder="user@example.com"
                      required
                      disabled={!isCreating} // Can't change email on edit
                    />
                  </div>
                  {!isCreating && (
                    <p className="text-xs text-gray-500 ml-1">Email cannot be changed</p>
                  )}
                </div>

                {/* Phone Number Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/\D/g, '') })}
                      placeholder="0912 345 6789"
                      maxLength={11}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Password {isCreating && "*"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={isCreating ? "Minimum 6 characters" : "Leave blank to keep current"}
                      required={isCreating}
                      minLength={isCreating ? 6 : undefined}
                      maxLength={35}
                    />
                  </div>
                  {!isCreating && (
                    <p className="text-xs text-gray-500 ml-1">Leave blank to keep current password</p>
                  )}
                </div>

                {/* Role Select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Role *</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Status Select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Account Status</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                      <input 
                        type="radio" 
                        name="status"
                        checked={form.is_active === true}
                        onChange={() => setForm({...form, is_active: true})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1">
                      <input 
                        type="radio" 
                        name="status"
                        checked={form.is_active === false}
                        onChange={() => setForm({...form, is_active: false})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                  >
                    {isCreating ? "Create User" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
