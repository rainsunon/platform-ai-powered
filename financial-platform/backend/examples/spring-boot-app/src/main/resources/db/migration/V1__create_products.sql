CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(200)    NOT NULL,
  description VARCHAR(2000)   NOT NULL,
  price       NUMERIC(19, 4)  NOT NULL CHECK (price > 0),
  active      BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  version     BIGINT          NOT NULL DEFAULT 0
);

CREATE INDEX idx_products_name        ON products (lower(name));
CREATE INDEX idx_products_active_name ON products (active, lower(name)) WHERE active = TRUE;
