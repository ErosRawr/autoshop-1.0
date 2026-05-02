-- ============================================================
--  AUTOSHOP MANAGEMENT SYSTEM
--  Complete PostgreSQL Database — Schema + Triggers + KPIs
--
--  Sections:
--    1. Extensions
--    2. Enums
--    3. Tables
--    4. Indexes
--    5. Triggers
--    6. KPI Queries
-- ============================================================


-- ============================================================
--  1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_uuid()


-- ============================================================
--  2. ENUMS
-- ============================================================

CREATE TYPE user_role           AS ENUM ('admin', 'mechanic', 'receptionist');
CREATE TYPE appointment_status  AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed');
CREATE TYPE work_order_status   AS ENUM ('open', 'in_progress', 'waiting_parts', 'completed', 'cancelled');
CREATE TYPE work_order_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE service_category    AS ENUM ('maintenance', 'repair', 'diagnostic', 'electrical', 'bodywork', 'other');
CREATE TYPE movement_reason     AS ENUM ('purchase', 'work_order_use', 'adjustment', 'return', 'write_off');
CREATE TYPE invoice_status      AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'cancelled');


-- ============================================================
--  3. TABLES
-- ============================================================

-- ------------------------------------------------------------
--  LOCATIONS
--  Every branch is a row here. Most operational tables
--  reference location_id to keep data branch-scoped.
-- ------------------------------------------------------------
CREATE TABLE Locations (
    location_id  BIGSERIAL     PRIMARY KEY,
    name         VARCHAR(120)  NOT NULL,
    address      TEXT          NOT NULL,
    phone        VARCHAR(30),
    email        VARCHAR(120),
    is_active    BOOLEAN       NOT NULL DEFAULT true,
    created_at   TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  CUSTOMERS
-- ------------------------------------------------------------
CREATE TABLE Customers (
    customer_id    BIGSERIAL     PRIMARY KEY,
    name           VARCHAR(120)  NOT NULL,
    phone          VARCHAR(30),
    email          VARCHAR(120),
    address        TEXT,
    -- Mexican fiscal fields
    rfc            VARCHAR(13),
    business_name  VARCHAR(200),
    fiscal_address TEXT,
    created_at     TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  VEHICLES
--  VIN carries a unique constraint (nullable — not all
--  vehicles have one; PostgreSQL does not flag NULL conflicts).
-- ------------------------------------------------------------
CREATE TABLE Vehicles (
    vehicle_id   BIGSERIAL    PRIMARY KEY,
    customer_id  BIGINT       NOT NULL REFERENCES Customers(customer_id),
    make         VARCHAR(60),
    model        VARCHAR(60),
    year         SMALLINT     CHECK (year BETWEEN 1900 AND 2100),
    vin          VARCHAR(17)  UNIQUE,
    plate        VARCHAR(20),
    color        VARCHAR(40),
    vehicle_type VARCHAR(40),
    notes        TEXT,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  USERS
--  All staff who log in. is_active allows deactivation without
--  losing historical references (FK integrity stays intact).
-- ------------------------------------------------------------
CREATE TABLE Users (
    user_id      BIGSERIAL     PRIMARY KEY,
    location_id  BIGINT        NOT NULL REFERENCES Locations(location_id),
    name         VARCHAR(120)  NOT NULL,
    username     VARCHAR(60)   NOT NULL UNIQUE,
    password     VARCHAR(255)  NOT NULL,   -- store hashed, never plaintext
    role         user_role     NOT NULL,
    is_active    BOOLEAN       NOT NULL DEFAULT true,
    created_at   TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT now()
);

-- Optional: allow a user to work at multiple branches.
-- Uncomment and remove Users.location_id if needed.
-- CREATE TABLE User_Locations (
--     user_id     BIGINT NOT NULL REFERENCES Users(user_id),
--     location_id BIGINT NOT NULL REFERENCES Locations(location_id),
--     PRIMARY KEY (user_id, location_id)
-- );


-- ------------------------------------------------------------
--  MECHANICS
--  Domain profile layered on top of a Users row.
-- ------------------------------------------------------------
CREATE TABLE Mechanics (
    mechanic_id  BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL UNIQUE REFERENCES Users(user_id),
    specialty    VARCHAR(120)
);


-- ------------------------------------------------------------
--  SUPPLIERS
-- ------------------------------------------------------------
CREATE TABLE Suppliers (
    supplier_id   BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    contact_name  VARCHAR(120),
    phone         VARCHAR(30),
    email         VARCHAR(120),
    notes         TEXT,
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  PARTS  (catalog only — no stock column here)
--  Stock lives in Location_Inventory so each branch tracks
--  its own quantities independently.
-- ------------------------------------------------------------
CREATE TABLE Parts (
    part_id      BIGSERIAL      PRIMARY KEY,
    supplier_id  BIGINT         REFERENCES Suppliers(supplier_id),
    name         VARCHAR(120)   NOT NULL,
    description  TEXT,
    part_number  VARCHAR(80),
    cost_price   NUMERIC(10,2)  NOT NULL,
    sale_price   NUMERIC(10,2)  NOT NULL,
    is_active    BOOLEAN        NOT NULL DEFAULT true,
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  LOCATION_INVENTORY
--  Per-branch stock levels. Replaces Parts.stock/min_stock.
--  Never write to this table directly — insert into
--  Inventory_Movements and the trigger keeps this in sync.
-- ------------------------------------------------------------
CREATE TABLE Location_Inventory (
    location_id  BIGINT  NOT NULL REFERENCES Locations(location_id),
    part_id      BIGINT  NOT NULL REFERENCES Parts(part_id),
    stock        INT     NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock    INT     NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    PRIMARY KEY (location_id, part_id)
);


-- ------------------------------------------------------------
--  APPOINTMENTS
-- ------------------------------------------------------------
CREATE TABLE Appointments (
    appointment_id    BIGSERIAL          PRIMARY KEY,
    location_id       BIGINT             NOT NULL REFERENCES Locations(location_id),
    customer_id       BIGINT             NOT NULL REFERENCES Customers(customer_id),
    vehicle_id        BIGINT             NOT NULL REFERENCES Vehicles(vehicle_id),
    assigned_to       BIGINT             REFERENCES Mechanics(mechanic_id),
    scheduled_at      TIMESTAMP          NOT NULL,
    duration_estimate INT,               -- estimated duration in minutes
    notes             TEXT,
    status            appointment_status NOT NULL DEFAULT 'scheduled',
    created_at        TIMESTAMP          NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP          NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  WORK_ORDERS
--  customer_id is kept alongside vehicle_id intentionally for
--  query convenience. The application layer must ensure they
--  are consistent with the vehicle's registered owner.
-- ------------------------------------------------------------
CREATE TABLE Work_Orders (
    work_order_id        BIGSERIAL           PRIMARY KEY,
    location_id          BIGINT              NOT NULL REFERENCES Locations(location_id),
    customer_id          BIGINT              NOT NULL REFERENCES Customers(customer_id),
    vehicle_id           BIGINT              NOT NULL REFERENCES Vehicles(vehicle_id),
    appointment_id       BIGINT              REFERENCES Appointments(appointment_id),
    created_by           BIGINT              NOT NULL REFERENCES Users(user_id),
    date_open            DATE                NOT NULL,
    date_estimated       DATE,
    date_close           DATE,
    status               work_order_status   NOT NULL DEFAULT 'open',
    priority             work_order_priority NOT NULL DEFAULT 'normal',
    problem_description  TEXT,
    diagnostic_notes     TEXT,
    mileage              INT,
    fuel_level           SMALLINT            CHECK (fuel_level BETWEEN 0 AND 100),
    created_at           TIMESTAMP           NOT NULL DEFAULT now(),
    updated_at           TIMESTAMP           NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  SERVICES  (catalog)
-- ------------------------------------------------------------
CREATE TABLE Services (
    service_id   BIGSERIAL        PRIMARY KEY,
    name         VARCHAR(120)     NOT NULL,
    description  TEXT,
    category     service_category,
    base_price   NUMERIC(10,2)    NOT NULL,
    is_active    BOOLEAN          NOT NULL DEFAULT true,
    created_at   TIMESTAMP        NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP        NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  WORKORDER_SERVICES  (line items — labour)
--  mechanic_id records who performed each specific service,
--  complementing the broader WorkOrder_Mechanics assignment.
-- ------------------------------------------------------------
CREATE TABLE WorkOrder_Services (
    id             BIGSERIAL      PRIMARY KEY,
    work_order_id  BIGINT         NOT NULL REFERENCES Work_Orders(work_order_id),
    service_id     BIGINT         NOT NULL REFERENCES Services(service_id),
    mechanic_id    BIGINT         REFERENCES Mechanics(mechanic_id),
    hours          NUMERIC(5,2),
    price_at_time  NUMERIC(10,2)  NOT NULL,
    notes          TEXT
);


-- ------------------------------------------------------------
--  WORKORDER_PARTS  (line items — parts)
--  cost_price_at_time snapshots the cost so historical profit
--  calculations remain accurate even after catalog price edits.
-- ------------------------------------------------------------
CREATE TABLE WorkOrder_Parts (
    id                  BIGSERIAL      PRIMARY KEY,
    work_order_id       BIGINT         NOT NULL REFERENCES Work_Orders(work_order_id),
    part_id             BIGINT         NOT NULL REFERENCES Parts(part_id),
    quantity            INT            NOT NULL CHECK (quantity > 0),
    price_at_time       NUMERIC(10,2)  NOT NULL,   -- sale price snapshot
    cost_price_at_time  NUMERIC(10,2)  NOT NULL    -- cost price snapshot
);


-- ------------------------------------------------------------
--  INVENTORY_MOVEMENTS  (audit log)
--  This is the single source of truth for stock changes.
--  quantity is signed: positive = stock in, negative = stock out.
--  A trigger on this table keeps Location_Inventory in sync.
-- ------------------------------------------------------------
CREATE TABLE Inventory_Movements (
    movement_id    BIGSERIAL       PRIMARY KEY,
    location_id    BIGINT          NOT NULL REFERENCES Locations(location_id),
    part_id        BIGINT          NOT NULL REFERENCES Parts(part_id),
    user_id        BIGINT          NOT NULL REFERENCES Users(user_id),
    work_order_id  BIGINT          REFERENCES Work_Orders(work_order_id),
    quantity       INT             NOT NULL,
    reason         movement_reason NOT NULL,
    notes          TEXT,
    date           TIMESTAMP       NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
--  WORKORDER_MECHANICS  (labour assignment per order)
-- ------------------------------------------------------------
CREATE TABLE WorkOrder_Mechanics (
    id             BIGSERIAL    PRIMARY KEY,
    work_order_id  BIGINT       NOT NULL REFERENCES Work_Orders(work_order_id),
    mechanic_id    BIGINT       NOT NULL REFERENCES Mechanics(mechanic_id),
    hours_worked   NUMERIC(5,2),
    UNIQUE (work_order_id, mechanic_id)
);


-- ------------------------------------------------------------
--  INVOICES
--  Mexican CFDI fiscal fields included.
--  subtotal + iva = total (all three stored for auditability).
-- ------------------------------------------------------------
CREATE TABLE Invoices (
    invoice_id     BIGSERIAL      PRIMARY KEY,
    work_order_id  BIGINT         NOT NULL UNIQUE REFERENCES Work_Orders(work_order_id),
    customer_id    BIGINT         NOT NULL REFERENCES Customers(customer_id),
    folio          VARCHAR(30)    UNIQUE,
    uuid_fiscal    UUID           UNIQUE,           -- CFDI UUID from PAC stamping
    subtotal       NUMERIC(10,2)  NOT NULL,
    iva_rate       NUMERIC(5,4)   NOT NULL DEFAULT 0.16,  -- 0.16 general / 0.08 border
    iva            NUMERIC(10,2)  NOT NULL,
    total          NUMERIC(10,2)  NOT NULL,
    payment_method VARCHAR(60),
    payment_form   VARCHAR(60),
    cfdi_use       VARCHAR(10),                     -- SAT key e.g. G03
    status         invoice_status NOT NULL DEFAULT 'draft',
    date           TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT now(),

    CONSTRAINT total_check CHECK (abs(total - (subtotal + iva)) < 0.01)
);


-- ------------------------------------------------------------
--  PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE Payments (
    payment_id      BIGSERIAL      PRIMARY KEY,
    invoice_id      BIGINT         NOT NULL REFERENCES Invoices(invoice_id),
    amount          NUMERIC(10,2)  NOT NULL CHECK (amount > 0),
    payment_method  VARCHAR(60)    NOT NULL,
    reference       VARCHAR(120),  -- transaction ID, cheque #, transfer ref, etc.
    notes           TEXT,
    date            TIMESTAMP      NOT NULL DEFAULT now()
);


-- ============================================================
--  4. INDEXES
-- ============================================================

-- Customer lookups
CREATE INDEX idx_vehicles_customer       ON Vehicles(customer_id);
CREATE INDEX idx_appointments_customer   ON Appointments(customer_id);
CREATE INDEX idx_work_orders_customer    ON Work_Orders(customer_id);

-- Location-scoped queries
CREATE INDEX idx_locations_active        ON Locations(is_active);
CREATE INDEX idx_users_location          ON Users(location_id);
CREATE INDEX idx_appointments_location   ON Appointments(location_id);
CREATE INDEX idx_work_orders_location    ON Work_Orders(location_id);
CREATE INDEX idx_inv_movements_location  ON Inventory_Movements(location_id);

-- Work order joins
CREATE INDEX idx_wo_services_wo          ON WorkOrder_Services(work_order_id);
CREATE INDEX idx_wo_parts_wo             ON WorkOrder_Parts(work_order_id);
CREATE INDEX idx_wo_mechanics_wo         ON WorkOrder_Mechanics(work_order_id);
CREATE INDEX idx_inv_movements_wo        ON Inventory_Movements(work_order_id);

-- Inventory
CREATE INDEX idx_loc_inventory_part      ON Location_Inventory(part_id);
CREATE INDEX idx_inv_movements_part      ON Inventory_Movements(part_id);

-- Status filtering (dashboards)
CREATE INDEX idx_work_orders_status      ON Work_Orders(status);
CREATE INDEX idx_appointments_status     ON Appointments(status);
CREATE INDEX idx_invoices_status         ON Invoices(status);

-- Date-range queries
CREATE INDEX idx_appointments_scheduled  ON Appointments(scheduled_at);
CREATE INDEX idx_work_orders_date_open   ON Work_Orders(date_open);
CREATE INDEX idx_invoices_date           ON Invoices(date);
CREATE INDEX idx_payments_date           ON Payments(date);
CREATE INDEX idx_inv_movements_date      ON Inventory_Movements(date);


-- ============================================================
--  5. TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
--  5a. updated_at — auto-stamp on every UPDATE
--  One shared function, one trigger per table that has updated_at.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_locations_updated_at
    BEFORE UPDATE ON Locations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON Customers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON Vehicles
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON Suppliers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_parts_updated_at
    BEFORE UPDATE ON Parts
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON Appointments
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON Work_Orders
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON Services
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON Invoices
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ------------------------------------------------------------
--  5b. Inventory sync
--  On every INSERT into Inventory_Movements, upsert the
--  running total in Location_Inventory and guard against
--  stock going negative.
--
--  Write pattern:
--    Stock in  → positive quantity  (purchase, return)
--    Stock out → negative quantity  (work_order_use, write_off)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_inventory_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_stock INT;
BEGIN
    -- Upsert the running balance
    INSERT INTO Location_Inventory (location_id, part_id, stock, min_stock)
    VALUES (NEW.location_id, NEW.part_id, NEW.quantity, 0)
    ON CONFLICT (location_id, part_id)
    DO UPDATE SET stock = Location_Inventory.stock + NEW.quantity;

    -- Read the result back and reject if it went negative
    SELECT stock INTO v_stock
    FROM Location_Inventory
    WHERE location_id = NEW.location_id
      AND part_id     = NEW.part_id;

    IF v_stock < 0 THEN
        RAISE EXCEPTION
            'Insufficient stock: part_id=% at location_id=% would be %',
            NEW.part_id, NEW.location_id, v_stock;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_movement_sync
    AFTER INSERT ON Inventory_Movements
    FOR EACH ROW EXECUTE FUNCTION fn_sync_inventory_stock();


-- ------------------------------------------------------------
--  5c. WorkOrder_Parts → auto-create Inventory_Movement
--  When a part is added to a work order, automatically log
--  the stock deduction so the app layer doesn't have to
--  remember to do it manually.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_wo_parts_deduct_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_location_id BIGINT;
    v_created_by  BIGINT;
BEGIN
    SELECT location_id, created_by
    INTO   v_location_id, v_created_by
    FROM   Work_Orders
    WHERE  work_order_id = NEW.work_order_id;

    INSERT INTO Inventory_Movements
        (location_id, part_id, user_id, work_order_id, quantity, reason)
    VALUES
        (v_location_id, NEW.part_id, v_created_by, NEW.work_order_id,
         -NEW.quantity,              -- negative = stock out
         'work_order_use');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wo_parts_deduct_stock
    AFTER INSERT ON WorkOrder_Parts
    FOR EACH ROW EXECUTE FUNCTION fn_wo_parts_deduct_stock();


-- ============================================================
--  6. KPI QUERIES
--
--  Parameters used throughout:
--    :location_id  — pass a BIGINT to scope to one branch,
--                    or NULL to aggregate all locations.
--    :date_from    — TIMESTAMP range start (inclusive)
--    :date_to      — TIMESTAMP range end   (inclusive)
--    :customer_id  — used in customer-specific queries
-- ============================================================


-- ------------------------------------------------------------
--  REVENUE
-- ------------------------------------------------------------

-- [R1] Total revenue for a given period
SELECT
    COALESCE(SUM(i.total), 0) AS total_revenue
FROM Invoices i
JOIN Work_Orders wo ON wo.work_order_id = i.work_order_id
WHERE i.status NOT IN ('cancelled', 'draft')
  AND i.date BETWEEN :date_from AND :date_to
  AND (:location_id IS NULL OR wo.location_id = :location_id);


-- [R2] Revenue grouped by period
--      Change date_trunc granularity: 'day' | 'week' | 'month'
SELECT
    date_trunc('month', i.date) AS period,
    COUNT(*)                    AS invoice_count,
    COALESCE(SUM(i.total), 0)   AS total_revenue
FROM Invoices i
JOIN Work_Orders wo ON wo.work_order_id = i.work_order_id
WHERE i.status NOT IN ('cancelled', 'draft')
  AND i.date BETWEEN :date_from AND :date_to
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY period
ORDER BY period;


-- [R3] Average ticket size
SELECT
    ROUND(SUM(i.total) / NULLIF(COUNT(*), 0), 2) AS avg_ticket_size
FROM Invoices i
JOIN Work_Orders wo ON wo.work_order_id = i.work_order_id
WHERE i.status NOT IN ('cancelled', 'draft')
  AND i.date BETWEEN :date_from AND :date_to
  AND (:location_id IS NULL OR wo.location_id = :location_id);


-- ------------------------------------------------------------
--  WORK ORDERS
-- ------------------------------------------------------------

-- [W1] Work orders completed per period
SELECT
    date_trunc('month', date_close::TIMESTAMP) AS period,
    COUNT(*)                                   AS completed_orders
FROM Work_Orders
WHERE status = 'completed'
  AND date_close BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR location_id = :location_id)
GROUP BY period
ORDER BY period;


-- [W2] Open work orders (priority-sorted)
SELECT
    wo.work_order_id,
    l.name                                          AS location_name,
    c.name                                          AS customer_name,
    c.phone                                         AS customer_phone,
    v.make || ' ' || v.model || ' ' || v.year       AS vehicle,
    v.plate,
    wo.priority,
    wo.date_open,
    wo.date_estimated,
    wo.problem_description
FROM Work_Orders wo
JOIN Locations l ON l.location_id = wo.location_id
JOIN Customers c ON c.customer_id = wo.customer_id
JOIN Vehicles  v ON v.vehicle_id  = wo.vehicle_id
WHERE wo.status = 'open'
  AND (:location_id IS NULL OR wo.location_id = :location_id)
ORDER BY
    CASE wo.priority
        WHEN 'urgent' THEN 1 WHEN 'high'   THEN 2
        WHEN 'normal' THEN 3 WHEN 'low'    THEN 4
    END,
    wo.date_open;


-- [W3] Work orders in progress
SELECT
    wo.work_order_id,
    l.name                                          AS location_name,
    c.name                                          AS customer_name,
    v.make || ' ' || v.model || ' ' || v.year       AS vehicle,
    v.plate,
    wo.priority,
    wo.date_open,
    wo.date_estimated,
    CURRENT_DATE - wo.date_open                     AS days_open,
    STRING_AGG(DISTINCT u.name, ', ')               AS assigned_mechanics
FROM Work_Orders wo
JOIN Locations         l   ON l.location_id    = wo.location_id
JOIN Customers         c   ON c.customer_id    = wo.customer_id
JOIN Vehicles          v   ON v.vehicle_id     = wo.vehicle_id
LEFT JOIN WorkOrder_Mechanics wm ON wm.work_order_id = wo.work_order_id
LEFT JOIN Mechanics           m  ON m.mechanic_id    = wm.mechanic_id
LEFT JOIN Users               u  ON u.user_id        = m.user_id
WHERE wo.status = 'in_progress'
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY
    wo.work_order_id, l.name, c.name,
    v.make, v.model, v.year, v.plate,
    wo.priority, wo.date_open, wo.date_estimated
ORDER BY wo.date_open;


-- [W4] Average repair time in hours
SELECT
    ROUND(
        AVG(
            EXTRACT(EPOCH FROM
                (date_close::TIMESTAMP - date_open::TIMESTAMP)
            ) / 3600
        )::NUMERIC,
        1
    ) AS avg_repair_hours
FROM Work_Orders
WHERE status    = 'completed'
  AND date_close IS NOT NULL
  AND date_close BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR location_id = :location_id);


-- ------------------------------------------------------------
--  SERVICES
-- ------------------------------------------------------------

-- [S1] Most common services by count
SELECT
    s.service_id,
    s.name                                  AS service_name,
    s.category,
    COUNT(*)                                AS times_performed,
    ROUND(SUM(ws.price_at_time), 2)         AS total_revenue
FROM WorkOrder_Services ws
JOIN Services    s  ON s.service_id     = ws.service_id
JOIN Work_Orders wo ON wo.work_order_id = ws.work_order_id
WHERE wo.status NOT IN ('cancelled')
  AND wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY s.service_id, s.name, s.category
ORDER BY times_performed DESC;


-- [S2] Services by revenue generated
SELECT
    s.service_id,
    s.name                                  AS service_name,
    s.category,
    COUNT(*)                                AS times_performed,
    ROUND(SUM(ws.price_at_time), 2)         AS total_revenue,
    ROUND(AVG(ws.price_at_time), 2)         AS avg_price
FROM WorkOrder_Services ws
JOIN Services    s  ON s.service_id     = ws.service_id
JOIN Work_Orders wo ON wo.work_order_id = ws.work_order_id
WHERE wo.status NOT IN ('cancelled')
  AND wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY s.service_id, s.name, s.category
ORDER BY total_revenue DESC;


-- ------------------------------------------------------------
--  PARTS / INVENTORY
-- ------------------------------------------------------------

-- [P1] Most used parts by quantity
SELECT
    p.part_id,
    p.name                                              AS part_name,
    p.part_number,
    SUM(wp.quantity)                                    AS total_used,
    ROUND(SUM(wp.quantity * wp.price_at_time), 2)       AS total_billed
FROM WorkOrder_Parts wp
JOIN Parts       p  ON p.part_id       = wp.part_id
JOIN Work_Orders wo ON wo.work_order_id = wp.work_order_id
WHERE wo.status NOT IN ('cancelled')
  AND wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY p.part_id, p.name, p.part_number
ORDER BY total_used DESC;


-- [P2] Current stock per part per location
SELECT
    l.location_id,
    l.name           AS location_name,
    p.part_id,
    p.name           AS part_name,
    p.part_number,
    li.stock,
    li.min_stock,
    li.stock - li.min_stock AS buffer
FROM Location_Inventory li
JOIN Locations l ON l.location_id = li.location_id
JOIN Parts     p ON p.part_id     = li.part_id
WHERE p.is_active = true
  AND (:location_id IS NULL OR li.location_id = :location_id)
ORDER BY l.name, p.name;


-- [P3] Low stock alerts
SELECT
    l.location_id,
    l.name                                          AS location_name,
    p.part_id,
    p.name                                          AS part_name,
    p.part_number,
    li.stock                                        AS current_stock,
    li.min_stock,
    li.min_stock - li.stock                         AS units_needed,
    p.cost_price,
    ROUND((li.min_stock - li.stock) * p.cost_price, 2) AS reorder_cost_estimate
FROM Location_Inventory li
JOIN Locations l ON l.location_id = li.location_id
JOIN Parts     p ON p.part_id     = li.part_id
WHERE li.stock < li.min_stock
  AND p.is_active = true
  AND (:location_id IS NULL OR li.location_id = :location_id)
ORDER BY units_needed DESC;


-- [P4] Inventory usage over time (from movements log)
SELECT
    date_trunc('month', im.date) AS period,
    l.name                       AS location_name,
    im.reason,
    COUNT(*)                     AS movement_count,
    SUM(im.quantity)             AS net_quantity
FROM Inventory_Movements im
JOIN Locations l ON l.location_id = im.location_id
WHERE im.date BETWEEN :date_from AND :date_to
  AND (:location_id IS NULL OR im.location_id = :location_id)
GROUP BY period, l.name, im.reason
ORDER BY period, l.name, im.reason;


-- ------------------------------------------------------------
--  CUSTOMERS
-- ------------------------------------------------------------

-- [C1] Customers with unpaid invoices
SELECT
    c.customer_id,
    c.name                                              AS customer_name,
    c.phone,
    c.email,
    COUNT(i.invoice_id)                                 AS unpaid_invoice_count,
    ROUND(SUM(i.total), 2)                              AS total_owed,
    ROUND(COALESCE(SUM(p.amount), 0), 2)                AS total_paid,
    ROUND(SUM(i.total) - COALESCE(SUM(p.amount), 0), 2) AS outstanding_balance
FROM Customers c
JOIN Invoices     i ON i.customer_id = c.customer_id
LEFT JOIN Payments p ON p.invoice_id = i.invoice_id
WHERE i.status NOT IN ('paid', 'cancelled')
GROUP BY c.customer_id, c.name, c.phone, c.email
HAVING SUM(i.total) - COALESCE(SUM(p.amount), 0) > 0
ORDER BY outstanding_balance DESC;


-- [C2] Top customers by total invoiced
SELECT
    c.customer_id,
    c.name                                   AS customer_name,
    c.phone,
    c.email,
    COUNT(DISTINCT wo.work_order_id)         AS total_work_orders,
    COUNT(DISTINCT v.vehicle_id)             AS vehicles_registered,
    ROUND(SUM(i.total), 2)                   AS total_invoiced,
    ROUND(AVG(i.total), 2)                   AS avg_invoice
FROM Customers   c
JOIN Work_Orders wo ON wo.customer_id   = c.customer_id
JOIN Invoices    i  ON i.work_order_id  = wo.work_order_id
JOIN Vehicles    v  ON v.customer_id    = c.customer_id
WHERE i.status NOT IN ('cancelled', 'draft')
  AND i.date BETWEEN :date_from AND :date_to
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY c.customer_id, c.name, c.phone, c.email
ORDER BY total_invoiced DESC
LIMIT 20;


-- [C3] Full service history for a customer
SELECT
    wo.work_order_id,
    l.name                                          AS location_name,
    v.make || ' ' || v.model || ' ' || v.year       AS vehicle,
    v.plate,
    wo.date_open,
    wo.date_close,
    wo.status,
    wo.mileage,
    wo.problem_description,
    wo.diagnostic_notes,
    STRING_AGG(DISTINCT s.name, ', ')               AS services,
    STRING_AGG(DISTINCT p.name, ', ')               AS parts_used,
    ROUND(i.total, 2)                               AS invoice_total,
    i.status                                        AS invoice_status
FROM Work_Orders wo
JOIN Locations              l   ON l.location_id    = wo.location_id
JOIN Vehicles               v   ON v.vehicle_id     = wo.vehicle_id
LEFT JOIN WorkOrder_Services ws  ON ws.work_order_id = wo.work_order_id
LEFT JOIN Services           s   ON s.service_id     = ws.service_id
LEFT JOIN WorkOrder_Parts    wpr ON wpr.work_order_id = wo.work_order_id
LEFT JOIN Parts              p   ON p.part_id        = wpr.part_id
LEFT JOIN Invoices           i   ON i.work_order_id  = wo.work_order_id
WHERE wo.customer_id = :customer_id
GROUP BY
    wo.work_order_id, l.name, v.make, v.model, v.year,
    v.plate, wo.date_open, wo.date_close, wo.status,
    wo.mileage, wo.problem_description, wo.diagnostic_notes,
    i.total, i.status
ORDER BY wo.date_open DESC;


-- ------------------------------------------------------------
--  PAYMENTS
-- ------------------------------------------------------------

-- [PM1] Total payments received per period
SELECT
    date_trunc('month', p.date) AS period,
    COUNT(*)                    AS payment_count,
    ROUND(SUM(p.amount), 2)     AS total_received
FROM Payments    p
JOIN Invoices    i  ON i.invoice_id    = p.invoice_id
JOIN Work_Orders wo ON wo.work_order_id = i.work_order_id
WHERE p.date BETWEEN :date_from AND :date_to
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY period
ORDER BY period;


-- [PM2] Outstanding balance across all open invoices
SELECT
    ROUND(SUM(i.total), 2)                              AS total_invoiced,
    ROUND(COALESCE(SUM(p.amount), 0), 2)                AS total_collected,
    ROUND(SUM(i.total) - COALESCE(SUM(p.amount), 0), 2) AS outstanding_balance
FROM Invoices    i
LEFT JOIN Payments    p  ON p.invoice_id    = i.invoice_id
JOIN      Work_Orders wo ON wo.work_order_id = i.work_order_id
WHERE i.status NOT IN ('paid', 'cancelled')
  AND (:location_id IS NULL OR wo.location_id = :location_id);


-- [PM3] Partially paid invoices (detail)
SELECT
    i.invoice_id,
    i.folio,
    c.name                                              AS customer_name,
    c.phone,
    ROUND(i.total, 2)                                   AS invoice_total,
    ROUND(COALESCE(SUM(p.amount), 0), 2)                AS amount_paid,
    ROUND(i.total - COALESCE(SUM(p.amount), 0), 2)      AS remaining_balance,
    i.date                                              AS invoice_date,
    i.status
FROM Invoices    i
JOIN Customers   c  ON c.customer_id    = i.customer_id
JOIN Work_Orders wo ON wo.work_order_id = i.work_order_id
LEFT JOIN Payments p ON p.invoice_id = i.invoice_id
WHERE i.status NOT IN ('paid', 'cancelled')
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY
    i.invoice_id, i.folio, c.name, c.phone,
    i.total, i.date, i.status
HAVING i.total - COALESCE(SUM(p.amount), 0) > 0
ORDER BY remaining_balance DESC;


-- ------------------------------------------------------------
--  MECHANICS
-- ------------------------------------------------------------

-- [M1] Mechanic productivity: hours worked per period
SELECT
    m.mechanic_id,
    u.name                                  AS mechanic_name,
    m.specialty,
    l.name                                  AS location_name,
    COUNT(DISTINCT wm.work_order_id)        AS work_orders_assigned,
    ROUND(SUM(wm.hours_worked), 1)          AS total_hours_worked,
    ROUND(AVG(wm.hours_worked), 1)          AS avg_hours_per_order
FROM WorkOrder_Mechanics wm
JOIN Mechanics   m  ON m.mechanic_id    = wm.mechanic_id
JOIN Users       u  ON u.user_id        = m.user_id
JOIN Locations   l  ON l.location_id    = u.location_id
JOIN Work_Orders wo ON wo.work_order_id = wm.work_order_id
WHERE wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY m.mechanic_id, u.name, m.specialty, l.name
ORDER BY total_hours_worked DESC;


-- [M2] Work orders per mechanic with status breakdown
SELECT
    m.mechanic_id,
    u.name                                                          AS mechanic_name,
    COUNT(*)                                                        AS total_work_orders,
    COUNT(*) FILTER (WHERE wo.status = 'completed')                 AS completed,
    COUNT(*) FILTER (WHERE wo.status = 'in_progress')               AS in_progress,
    COUNT(*) FILTER (WHERE wo.status = 'open')                      AS open
FROM WorkOrder_Mechanics wm
JOIN Mechanics   m  ON m.mechanic_id    = wm.mechanic_id
JOIN Users       u  ON u.user_id        = m.user_id
JOIN Work_Orders wo ON wo.work_order_id = wm.work_order_id
WHERE wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY m.mechanic_id, u.name
ORDER BY total_work_orders DESC;


-- [M3] Most active mechanic this period
SELECT
    u.name                          AS mechanic_name,
    m.specialty,
    ROUND(SUM(wm.hours_worked), 1)  AS total_hours
FROM WorkOrder_Mechanics wm
JOIN Mechanics   m  ON m.mechanic_id    = wm.mechanic_id
JOIN Users       u  ON u.user_id        = m.user_id
JOIN Work_Orders wo ON wo.work_order_id = wm.work_order_id
WHERE wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR wo.location_id = :location_id)
GROUP BY m.mechanic_id, u.name, m.specialty
ORDER BY total_hours DESC
LIMIT 1;


-- ------------------------------------------------------------
--  PROFIT
-- ------------------------------------------------------------

-- [PR1] Gross profit on parts used
--       Uses cost_price_at_time snapshot for historical accuracy.
SELECT
    ROUND(SUM(wp.price_at_time      * wp.quantity), 2) AS total_parts_billed,
    ROUND(SUM(wp.cost_price_at_time * wp.quantity), 2) AS total_parts_cost,
    ROUND(SUM(
        (wp.price_at_time - wp.cost_price_at_time) * wp.quantity
    ), 2)                                              AS gross_parts_profit
FROM WorkOrder_Parts wp
JOIN Work_Orders wo ON wo.work_order_id = wp.work_order_id
WHERE wo.status NOT IN ('cancelled')
  AND wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
  AND (:location_id IS NULL OR wo.location_id = :location_id);


-- [PR2] Full P&L summary: revenue vs cost vs margin
WITH revenue AS (
    SELECT
        COALESCE(SUM(i.subtotal), 0) AS subtotal,
        COALESCE(SUM(i.iva),      0) AS tax_collected,
        COALESCE(SUM(i.total),    0) AS total_revenue
    FROM Invoices    i
    JOIN Work_Orders wo ON wo.work_order_id = i.work_order_id
    WHERE i.status NOT IN ('cancelled', 'draft')
      AND i.date BETWEEN :date_from AND :date_to
      AND (:location_id IS NULL OR wo.location_id = :location_id)
),
parts_cost AS (
    SELECT COALESCE(SUM(wp.cost_price_at_time * wp.quantity), 0) AS total_parts_cost
    FROM WorkOrder_Parts wp
    JOIN Work_Orders wo ON wo.work_order_id = wp.work_order_id
    WHERE wo.status NOT IN ('cancelled')
      AND wo.date_open BETWEEN :date_from::DATE AND :date_to::DATE
      AND (:location_id IS NULL OR wo.location_id = :location_id)
)
SELECT
    r.subtotal                                              AS revenue_before_tax,
    r.tax_collected,
    r.total_revenue,
    pc.total_parts_cost,
    ROUND(r.subtotal - pc.total_parts_cost, 2)             AS gross_profit,
    ROUND(
        CASE WHEN r.subtotal > 0
            THEN (r.subtotal - pc.total_parts_cost) / r.subtotal * 100
            ELSE 0
        END, 1
    )                                                       AS gross_margin_pct
FROM revenue r, parts_cost pc;