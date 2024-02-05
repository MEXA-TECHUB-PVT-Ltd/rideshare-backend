CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255),
  file_type VARCHAR(255),
  mime_type VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS preferences (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  -- 'chattiness', 'music', 'smoking', 'pets'
  icon TEXT,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
  email_verified BOOLEAN DEFAULT FALSE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth TIMESTAMP WITH TIME ZONE,
  gender TEXT,
  profile_uri TEXT,
  about VARCHAR(255),
  phone INT,
  post_address TEXT,
  complementary_address TEXT,
  location jsonb,
  insurance_status BOOLEAN DEFAULT FALSE,
  connected_insurances_user TEXT DEFAULT "pending",
  block_status BOOLEAN DEFAULT FALSE,
  payment_status BOOLEAN DEFAULT FALSE,
  deactivated BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  facebook_access_token TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_chattiness_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  chattiness_preference_id INT REFERENCES preferences(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_music_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  music_preference_id INT REFERENCES preferences(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_smoking_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  smoking_preference_id INT REFERENCES preferences(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_pets_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  pets_preference_id INT REFERENCES preferences(id) ON DELETE CASCADE,
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
  icon TEXT,
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
  return_ride_id INT REFERENCES rides(id) ON DELETE CASCADE,
  ride_status VARCHAR(100),
  vehicles_details_id INT REFERENCES vehicles_details(id) ON DELETE CASCADE,
  current_passenger_count INTEGER DEFAULT 0,
  wait_time INT DEFAULT 0,
  -- in minutes
  wait_time_cost DECIMAL(10, 2) DEFAULT 0.00,
  canceled_reason VARCHAR(255),
  canceled_ride_cost DECIMAL(10, 2) DEFAULT 0.00,
  ride_duration INTERVAL,
  ride_end_time VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ride_breaks (
  id SERIAL PRIMARY KEY,
  ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  duration INTERVAL,
  -- in minutes
  status VARCHAR(255),
  -- on_break, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ride_joiners(
  id SERIAL PRIMARY KEY,
  ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_per_seat INT,
  price_offer INT,
  pickup_location VARCHAR(255),
  drop_off_location VARCHAR(255),
  total_distance VARCHAR(255),
  pickup_time VARCHAR(255),
  no_seats INT,
  status VARCHAR(100) DEFAULT 'pending',
  -- e.g., 'pending', 'accepted', 'rejected'
  drop_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS late_ride_joiners(
  id SERIAL PRIMARY KEY,
  ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  ride_joiner_id INT NOT NULL REFERENCES ride_joiners(id) ON DELETE CASCADE,
  cost DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS search_ride_notifications(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location POINT,
  drop_off_location POINT,
  drop_off_address TEXT,
  pickup_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS fav_riders(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rider_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS contact_us(
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  message VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notification_types(
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notification (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type INT NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS rating(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id INT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rating INTEGER,
  comment VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bank_details(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cardholder_name VARCHAR(255),
  -- Name on the card
  card_number VARCHAR(255),
  -- Encrypted card number
  expiry_date DATE,
  -- Format: YYYY-MM or MM/YYYY
  cvv VARCHAR(255),
  -- Encrypted CVV
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS complaints(
  id SERIAL PRIMARY KEY,
  rider_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS app_link(
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
