BEGIN;

CREATE TABLE IF NOT EXISTS mobile_operations (
  id_mobile_operation BIGSERIAL PRIMARY KEY,
  id_utilizador INTEGER NOT NULL,
  client_operation_id VARCHAR(128) NOT NULL,
  operation_type VARCHAR(64) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  http_status SMALLINT NULL,
  response_json JSONB NULL,
  error_code VARCHAR(128) NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_mobile_operations_utilizador
    FOREIGN KEY (id_utilizador) REFERENCES utilizador(id_utilizador) ON DELETE CASCADE,
  CONSTRAINT uq_mobile_operations_user_client_operation
    UNIQUE (id_utilizador, client_operation_id),
  CONSTRAINT chk_mobile_operations_status
    CHECK (status IN ('processing', 'completed', 'failed_retryable', 'failed_permanent')),
  CONSTRAINT chk_mobile_operations_request_hash
    CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_mobile_operations_http_status
    CHECK (http_status IS NULL OR (http_status BETWEEN 100 AND 599))
);

ALTER TABLE mobile_operations
  ALTER COLUMN request_hash TYPE VARCHAR(64);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_mobile_operations_utilizador'
      AND conrelid = 'mobile_operations'::regclass
  ) THEN
    ALTER TABLE mobile_operations
      ADD CONSTRAINT fk_mobile_operations_utilizador
      FOREIGN KEY (id_utilizador)
      REFERENCES utilizador (id_utilizador)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_mobile_operations_status'
      AND conrelid = 'mobile_operations'::regclass
  ) THEN
    ALTER TABLE mobile_operations
      ADD CONSTRAINT chk_mobile_operations_status
      CHECK (status IN ('processing', 'completed', 'failed_retryable', 'failed_permanent'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_mobile_operations_request_hash'
      AND conrelid = 'mobile_operations'::regclass
  ) THEN
    ALTER TABLE mobile_operations
      ADD CONSTRAINT chk_mobile_operations_request_hash
      CHECK (request_hash ~ '^[0-9a-f]{64}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_mobile_operations_http_status'
      AND conrelid = 'mobile_operations'::regclass
  ) THEN
    ALTER TABLE mobile_operations
      ADD CONSTRAINT chk_mobile_operations_http_status
      CHECK (http_status IS NULL OR (http_status BETWEEN 100 AND 599));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mobile_operations_user_client_operation
  ON mobile_operations (id_utilizador, client_operation_id);

CREATE INDEX IF NOT EXISTS idx_mobile_operations_status
  ON mobile_operations (status);

CREATE INDEX IF NOT EXISTS idx_mobile_operations_expires_at
  ON mobile_operations (expires_at);

CREATE INDEX IF NOT EXISTS idx_mobile_operations_user_created_at
  ON mobile_operations (id_utilizador, created_at DESC);

COMMIT;

-- Limpeza futura, não agendada nesta fase:
-- DELETE FROM mobile_operations
-- WHERE expires_at < NOW()
--   AND status IN ('completed', 'failed_retryable', 'failed_permanent');
