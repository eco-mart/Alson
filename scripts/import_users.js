import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://tmojdzbbqqzlevyzfgiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtb2pkemJicXF6bGV2eXpmZ2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODk2OTUsImV4cCI6MjA4NDU2NTY5NX0.BHuGqZmywumT0wCQQZwryKmhljAxWT4ml-nHnjz2MRU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importCsv(filePath, role) {
    console.log(`Reading ${filePath} for role: ${role}...`);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

        // Assume first line is header: Name,Email
        const header = lines[0];
        if (!header.toLowerCase().includes('name') || !header.toLowerCase().includes('email')) {
            console.error(`Invalid header in ${filePath}: ${header}`);
            return;
        }

        const rows = [];
        // Start from index 1 to skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // Simple CSV parse: assume "Name,Email" with no commas in name for now, 
            // but based on file preview, names might not have commas. 
            // If they do, we need a better parser. 
            // Looking at the file preview: "Aabash Basnet,np01cp4a250150@islingtoncollege.edu.np"
            // It seems strictly comma separated.
            const parts = line.split(',');
            if (parts.length < 2) continue;

            const email = parts.pop().trim(); // Last part is email
            const name = parts.join(',').trim(); // Join the rest as name (in case of commas in name, though unlikely for this dataset)

            if (name && email) {
                rows.push({
                    name,
                    email,
                    role
                });
            }
        }

        console.log(`Found ${rows.length} entries. Inserting in batches...`);

        const BATCH_SIZE = 100;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from('user_details')
                .insert(batch);

            if (error) {
                console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
            } else {
                process.stdout.write('.');
            }
        }
        console.log(`\nFinished importing ${filePath}`);

    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
    }
}

async function main() {
    const studentPath = path.resolve(__dirname, '../assets/student.csv');
    const staffPath = path.resolve(__dirname, '../assets/staff.csv');

    await importCsv(studentPath, 'student');
    await importCsv(staffPath, 'staff');
}

main();
