import { supabase, verificationSupabase } from './api.js';
import { state, setCurrentUser } from './state.js';

export async function login(identifier, password) {
    const email = identifier.includes('@') ? identifier : `${identifier}@np.edu`;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    setCurrentUser(data.user);
    return data.user;
}

export async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
        return session.user;
    }
    return null;
}

export async function logout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
}

export async function verifyAndSignup(studentId, password) {
    // 1. Verify user in College DB
    const { data: users, error: verifyError } = await verificationSupabase
        .from('user_details')
        .select('name, email')
        .ilike('email', `${studentId}@%`)
        .limit(1);

    if (verifyError) throw verifyError;
    if (!users || users.length === 0) {
        throw new Error('Student ID not found in college records.');
    }

    const collegeUser = users[0];
    const email = `${studentId}@np.edu`;

    // 2. Register in App DB
    const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: collegeUser.name,
                student_id: studentId
            }
        }
    });

    if (signupError) throw signupError;
    return data;
}
