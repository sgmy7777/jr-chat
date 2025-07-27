/* Replace with your SQL commands */
CREATE TABLE messages (
                          message_id SERIAL PRIMARY KEY,
                          text TEXT,
                          created_at TIMESTAMP DEFAULT current_timestamp,
                          user_id INTEGER REFERENCES users ON DELETE SET NULL
);