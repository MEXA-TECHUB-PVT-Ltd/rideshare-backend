CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255),
  file_type VARCHAR(255),
  mime_type VARCHAR(255),
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
CREATE TABLE IF NOT EXISTS vehicle_types(
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS vehicle_colors(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS vehicles_details(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_plate_no TEXT,
  vehicle_brand jsonb,
  vehicle_model jsonb,
  registration_no TEXT,
  driving_license_no TEXT,
  license_expiry_date TIMESTAMP WITH TIME ZONE,
  personal_insurance BOOLEAN DEFAULT FALSE,
  vehicle_type_id INT REFERENCES vehicle_types(id) ON DELETE CASCADE,
  vehicle_color_id INT REFERENCES vehicle_colors(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cautions(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  uploaded_icon_id INT REFERENCES uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS passenger_rates(
  id SERIAL PRIMARY KEY,
  rate NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS driver_rates(
  id SERIAL PRIMARY KEY,
  start_range INT NOT NULL,
  -- store by miles
  end_range INT NOT NULL,
  -- store by miles
  rate_per_mile NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS rides(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location POINT,
  pickup_address VARCHAR(255),
  drop_off_location POINT,
  drop_off_address VARCHAR(255),
  tolls BOOLEAN DEFAULT FALSE,
  -- Tolls exist or not
  route_time INTERVAL,
  -- Time taken for the route
  city_of_route VARCHAR(255),
  -- City in which the route is located
  route_miles NUMERIC,
  -- Distance of the route in miles
  ride_date TIMESTAMP WITH TIME ZONE,
  -- Date of the ride
  time_to_pickup TIME,
  -- Time to pick up passengers
  cautions INT [],
  -- Array of caution IDs
  max_passengers INT,
  -- Maximum number of passengers
  request_option VARCHAR(50),
  -- Request option (e.g., 'instant', 'review')
  price_per_seat NUMERIC,
  -- Price per seat
  return_ride_status BOOLEAN DEFAULT FALSE,
  -- Return ride status
  current_passenger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS search_ride_notifications(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location POINT,
  drop_off_location POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
