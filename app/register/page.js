'use client';
import { useState } from 'react';

export default function Register() {
    const [form, setForm] = useState({
        username: '',
        password: '',
        full_name: '',
        role_id: 1
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        await fetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(form)
        });

        alert('User created!');
    };

    return (
        <form onSubmit={handleSubmit}>
            <input placeholder="Username" onChange={e => setForm({...form, username:e.target.value})} />
            <input placeholder="Password" type="password" onChange={e => setForm({...form, password:e.target.value})} />
            <input placeholder="Full Name" onChange={e => setForm({...form, full_name:e.target.value})} />

            <select onChange={e => setForm({...form, role_id:e.target.value})}>
                <option value="1">System Admin</option>
                <option value="2">Manager</option>
                <option value="3">Officer</option>
                <option value="4">Resident</option>
            </select>

            <button type="submit">Register</button>
        </form>
    );
}