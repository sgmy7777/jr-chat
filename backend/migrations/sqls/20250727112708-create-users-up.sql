/* Replace with your SQL commands */

CREATE TABLE users (
                       user_id SERIAL PRIMARY KEY,
                       username VARCHAR(255) UNIQUE NOT NULL,
                       CHECK (TRIM(username) <> '')
);