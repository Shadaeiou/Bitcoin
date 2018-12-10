CREATE DATABASE cryptocurrent;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "user" (
     user_id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     first_name varchar(40) NOT NULL CHECK (first_name <> ''),
     last_name  varchar(40) NOT NULL CHECK (last_name <> ''),
     email      varchar(40) NOT NULL CHECK (email <> ''),
     password   varchar(72) NOT NULL,
     salt       varchar(60) NOT NULL,
     status     boolean DEFAULT FALSE,
     created    timestamp DEFAULT NOW(),
     modified   timestamp DEFAULT NOW()
);

CREATE TABLE broker (
	broker_id SERIAL PRIMARY KEY,
	name      varchar(40) NOT NULL CHECK (name <> '')
);

INSERT INTO broker (name) VALUES ('Private'), ('Coinbase');

CREATE TABLE user_broker (
	user_broker_id SERIAL PRIMARY KEY,
	name       TEXT NOT NULL,
	sandbox    BOOLEAN,
	broker_id  INT REFERENCES broker,
	user_id    uuid REFERENCES "user",
	config     TEXT
);

CREATE TABLE currency (
	currency_id SERIAL PRIMARY KEY,
	name        varchar(40) NOT NULL CHECK (name <> ''),
	full_name   varchar(40) NOT NULL CHECK (full_name <> ''),
	type        varchar(20)
);

INSERT INTO currency (name, full_name, type) VALUES ('btc', 'Bitcoin', 'crypto');
INSERT INTO currency (name, full_name, type) VALUES ('eth', 'Ethereum', 'crypto');
INSERT INTO currency (name, full_name, type) VALUES ('ltc', 'Litecoin', 'crypto');
INSERT INTO currency (name, full_name, type) VALUES ('$', 'USD', 'fund');

CREATE TABLE user_wallet (
	user_wallet_id SERIAL PRIMARY KEY,
	name           varchar(40) NOT NULL CHECK (name <> ''),
	user_broker_id INT REFERENCES user_broker,
	balance        float8 NOT NULL,
	currency_id    INT REFERENCES currency,
	status         boolean DEFAULT FALSE,
	created        timestamp DEFAULT NOW(),
	modified       timestamp DEFAULT NOW()
);

CREATE TABLE currency_price_point (
	currency_price_point_id SERIAL PRIMARY KEY,
	currency_id             INT REFERENCES currency,
	broker_id               INT REFERENCES broker,
	buy_price               MONEY NOT NULL,
	sell_price              MONEY NOT NULL,
	unix_time               BIGINT NOT NULL
);

CREATE TABLE algorithm (
	algorithm_id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name                  varchar(40) NOT NULL CHECK (name <> ''),
	text                  TEXT,
	run_frequency         TEXT DEFAULT '-1',
	fund_user_wallet_id   INT REFERENCES user_wallet,
	crypto_user_wallet_id INT REFERENCES user_wallet,
	user_id               uuid REFERENCES "user",
	status                boolean DEFAULT FALSE,
	created               timestamp DEFAULT NOW(),
	modified              timestamp DEFAULT NOW()
);

CREATE TABLE notification_type (
	notification_type_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name                      TEXT,
	abbr                      TEXT,
	status                    BOOLEAN DEFAULT TRUE
);

INSERT INTO notification_type (name, abbr) VALUES 
('Buy',  'buy'),
('Sell', 'sell'),
('Fund', 'fund');

CREATE TABLE notification (
	notification_id      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id              uuid REFERENCES "user",
	notification_type_id uuid REFERENCES notification_type,
	text                 TEXT,
	json_meta            TEXT,
	unix_time            BIGINT,
	sent                 BOOLEAN DEFAULT FALSE,
	status               BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_wallet_transaction (
	user_wallet_transaction_id SERIAL PRIMARY KEY,
	user_wallet_id             INT REFERENCES user_wallet,
	buy_price                  MONEY NOT NULL,
	price_needed               MONEY NOT NULL,
	amount                     float8 NOT NULL,
	unix_time_bought           BIGINT NOT NULL,
	money_spent                MONEY NOT NULL,
	sell_price                 MONEY,
	unix_time_sold             BIGINT,
	money_sold                 MONEY,
	active                     BOOLEAN DEFAULT TRUE
);
