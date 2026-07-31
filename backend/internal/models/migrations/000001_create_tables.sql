-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id serial primary key,
    full_name varchar(255) not null,
    email varchar(255) not null unique,
    phone_number varchar(30),
    birthday date,
    password_hash varchar(255) not null,
    role varchar(50) not null default 'user',
    is_active boolean default true,
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now()
);

-- Visitors
CREATE TABLE IF NOT EXISTS visitors (
    id serial primary key,
    full_name varchar(255) not null,
    email varchar(255),
    phone_number varchar(30),
    company varchar(255),
    reason varchar(1024) not null,
    visiting_name VARCHAR(255) NOT NULL DEFAULT '',
    created_by_user_id integer references users(id) on delete set null,
    is_active boolean default true,
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now()
);

-- Visit logs
CREATE TABLE IF NOT EXISTS visit_logs (
    id serial primary key,
    visitor_id integer references visitors(id) on delete cascade,
    time_in timestamp without time zone not null,
    time_out timestamp without time zone,
    duration_mins bigint,
    host_user_id integer references users(id) on delete set null,
    status varchar(50) not null default 'inside',
    notes varchar(1024),
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id serial primary key,
    type varchar(100) not null,
    message varchar(1024) not null,
    target_user_id integer references users(id) on delete set null,
    related_visit_id integer references visit_logs(id) on delete set null,
    is_read boolean default false,
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now()
);

-- Password reset codes
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id serial primary key,
    email varchar(255) not null,
    code varchar(10) not null,
    expires_at timestamp without time zone not null,
    used boolean default false,
    created_at timestamp without time zone default now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitlogs_visitor_id ON visit_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
