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
	account_id SERIAL PRIMARY KEY,
	broker_id  INT REFERENCES broker,
	user_id    uuid REFERENCES "user",
	config     TEXT
);

CREATE TABLE user_wallet (
	user_wallet_id SERIAL PRIMARY KEY,
	name           varchar(40) NOT NULL CHECK (name <> ''),
	user_broker_id INT REFERENCES user_broker,
	balance        MONEY,
	status         boolean DEFAULT FALSE,
	created        timestamp DEFAULT NOW(),
	modified       timestamp DEFAULT NOW()
);

CREATE TABLE currency (
	currency_id SERIAL PRIMARY KEY,
	name        varchar(40) NOT NULL CHECK (name <> ''),
	full_name   varchar(40) NOT NULL CHECK (full_name <> '')
);

INSERT INTO currency (name, full_name) VALUES ('btc', 'Bitcoin');
INSERT INTO currency (name, full_name) VALUES ('eth', 'Ethereum');
INSERT INTO currency (name, full_name) VALUES ('ltc', 'Litecoin');

CREATE TABLE currency_price_point (
	currency_price_point_id SERIAL PRIMARY KEY,
	currency_id             INT REFERENCES currency,
	broker_id               INT REFERENCES broker,
	buy_price               MONEY NOT NULL,
	sell_price              MONEY NOT NULL,
	unix_time               BIGINT NOT NULL
);

CREATE TABLE algorithm (
	algorithm_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name         varchar(40) NOT NULL CHECK (name <> ''),
	text         TEXT NOT NULL,
	user_id      uuid REFERENCES "user",
	sandbox      boolean default true,
	status       boolean DEFAULT FALSE,
	created      timestamp DEFAULT NOW(),
	modified     timestamp DEFAULT NOW()
);