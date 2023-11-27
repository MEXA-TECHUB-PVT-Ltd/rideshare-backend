CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255),
  file_type VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'user',
  -- user | admin
  type TEXT DEFAULT 'email',
  -- email | facebook
  device_id TEXT,
  otp INT,
  admin_name TEXT,
  -- allow for only admin users
  first_name TEXT,
  last_name TEXT,
  phone_no INT,
  about TEXT,
  date_of_birth TEXT,
  gender TEXT,
  profile_picture INT REFERENCES uploads(id) ON DELETE CASCADE,
  postal_address TEXT,
  complimentary_address TEXT,
  driving_license_no TEXT,
  license_expiry_date TEXT,
  travel_preference jsonb [],
  country TEXT,
  block_status BOOLEAN DEFAULT FALSE,
  payment_status BOOLEAN DEFAULT FALSE,
  deactivated BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  facebook_access_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles_details(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_plate_no TEXT,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  registration_no TEXT,
  driving_license_no TEXT,
  license_expiry_date TIMESTAMP WITH TIME ZONE,
  personal_insurance BOOLEAN DEFAULT FALSE,
  vehicle_type TEXT [],
  vehicle_color TEXT [],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
