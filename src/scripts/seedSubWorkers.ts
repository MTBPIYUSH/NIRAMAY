// Script to seed sub-worker accounts
// This should be run manually to create the auth users and profiles

import { supabase } from '../lib/supabase';

interface SubWorkerData {
  email: string;
  password: string;
  name: string;
  phone: string;
  status: 'available' | 'busy';
  ward: string;
  city: string;
}

const subWorkers: SubWorkerData[] = [
  {
    email: 'ravi.kumar@worker.gov.in',
    password: 'password123',
    name: 'Ravi Kumar',
    phone: '+91 98765 43210',
    status: 'busy',
    ward: 'Ward 12',
    city: 'Gurgaon'
  },
  {
    email: 'suresh.verma@worker.gov.in',
    password: 'password123',
    name: 'Suresh Verma',
    phone: '+91 87654 32109',
    status: 'available',
    ward: 'Ward 12',
    city: 'Gurgaon'
  },
  {
    email: 'amit.singh@worker.gov.in',
    password: 'password123',
    name: 'Amit Singh',
    phone: '+91 76543 21098',
    status: 'available',
    ward: 'Ward 12',
    city: 'Gurgaon'
  }
];

export const seedSubWorkerAccounts = async () => {
  console.log('Starting sub-worker account seeding...');

  for (const worker of subWorkers) {
    try {
      console.log(`Creating account for ${worker.name}...`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: worker.email,
        password: worker.password,
        options: {
          data: {
            name: worker.name,
            phone: worker.phone,
            role: 'subworker'
          }
        }
      });

      if (authError) {
        console.error(`Error creating auth user for ${worker.name}:`, authError);
        continue;
      }

      if (!authData.user) {
        console.error(`No user data returned for ${worker.name}`);
        continue;
      }

      console.log(`Auth user created for ${worker.name}: ${authData.user.id}`);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            role: 'subworker',
            name: worker.name,
            phone: worker.phone,
            status: worker.status,
            ward: worker.ward,
            city: worker.city,
            eco_points: 0
          }
        ]);

      if (profileError) {
        console.error(`Error creating profile for ${worker.name}:`, profileError);
        continue;
      }

      console.log(`✅ Successfully created account for ${worker.name}`);

    } catch (error) {
      console.error(`Unexpected error creating account for ${worker.name}:`, error);
    }
  }

  console.log('Sub-worker account seeding completed!');
};

// Uncomment to run the seeding
// seedSubWorkerAccounts();