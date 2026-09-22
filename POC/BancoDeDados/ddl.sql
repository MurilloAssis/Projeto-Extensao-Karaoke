CREATE DATABASE IF NOT EXISTS poc_karaoke;
USE poc_karaoke;

CREATE TABLE Usuario (
    User VARCHAR(50) PRIMARY KEY,
    Senha VARCHAR(255) NOT NULL
);

INSERT INTO Usuario
VALUES ('admin', 'admin');

