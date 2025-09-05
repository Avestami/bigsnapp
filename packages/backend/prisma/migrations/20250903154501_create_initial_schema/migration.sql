-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('DRIVER', 'RIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethodType" AS ENUM ('WALLET', 'CREDIT_CARD', 'CASH', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."WalletTransactionType" AS ENUM ('TOPUP', 'PAYMENT', 'PAYOUT', 'REFUND', 'PENALTY');

-- CreateEnum
CREATE TYPE "public"."DeliveryRequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RideStatus" AS ENUM ('PENDING', 'ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateTable
CREATE TABLE "public"."user" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "password_hash" TEXT,
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_type" "public"."UserType" NOT NULL,
    "phone_number" VARCHAR(15),
    "wallet_id" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."wallet" (
    "wallet_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "balance_rial" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "public"."driver" (
    "driver_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "license_number" VARCHAR(50) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("driver_id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_type" (
    "type_id" SERIAL NOT NULL,
    "max_weight" DOUBLE PRECISION,
    "name" VARCHAR(50) NOT NULL,
    "passenger_capacity" INTEGER,
    "has_cargo_box" BOOLEAN,

    CONSTRAINT "vehicle_type_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "public"."vehiclemodel" (
    "model_id" SERIAL NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "model_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "vehiclemodel_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "public"."vehicle" (
    "vehicle_id" SERIAL NOT NULL,
    "license_plate" VARCHAR(20) NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "color" VARCHAR(30) NOT NULL,
    "model_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "public"."location" (
    "location_id" SERIAL NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "public"."ride" (
    "ride_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "driver_id" INTEGER,
    "fare" BIGINT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "pickup_location_id" INTEGER NOT NULL,
    "drop_off_location" INTEGER NOT NULL,
    "status" "public"."RideStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_pkey" PRIMARY KEY ("ride_id")
);

-- CreateTable
CREATE TABLE "public"."ride_status_history" (
    "ride_id" INTEGER NOT NULL,
    "status_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "ride_status_history_pkey" PRIMARY KEY ("ride_id","status_time")
);

-- CreateTable
CREATE TABLE "public"."ride_review" (
    "review_id" SERIAL NOT NULL,
    "target_driver_id" INTEGER NOT NULL,
    "ride_id" INTEGER NOT NULL,
    "rating" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewer_id" INTEGER NOT NULL,
    "comment" TEXT,

    CONSTRAINT "ride_review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "public"."payment_method" (
    "method_id" SERIAL NOT NULL,
    "type" "public"."PaymentMethodType" NOT NULL,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("method_id")
);

-- CreateTable
CREATE TABLE "public"."payment" (
    "payment_id" SERIAL NOT NULL,
    "ride_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "public"."user_device" (
    "device_id" SERIAL NOT NULL,
    "device_type" "public"."DeviceType" NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_device_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "public"."favorite_location" (
    "fav_id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "favorite_location_pkey" PRIMARY KEY ("fav_id")
);

-- CreateTable
CREATE TABLE "public"."log" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "time_stamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "public"."delivery_request" (
    "delivery_id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "pickup_location_id" INTEGER NOT NULL,
    "drop_off_location_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,
    "value_rial" BIGINT NOT NULL,
    "status" "public"."DeliveryRequestStatus" NOT NULL,
    "scheduled_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_request_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "public"."delivery_review" (
    "review_id" SERIAL NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "target_driver_id" INTEGER NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "public"."delivery_assignment" (
    "delivery_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3),
    "picked_up_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "delivery_assignment_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "public"."delivery_status_history" (
    "delivery_id" INTEGER NOT NULL,
    "status_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "delivery_status_history_pkey" PRIMARY KEY ("delivery_id","status_time")
);

-- CreateTable
CREATE TABLE "public"."wallet_transaction" (
    "transaction_id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "description" TEXT,
    "type" "public"."WalletTransactionType" NOT NULL,
    "reference_type" VARCHAR(20),
    "reference_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."PaymentStatus" NOT NULL,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "public"."topup_request" (
    "topup_id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount_rial" BIGINT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "topup_request_pkey" PRIMARY KEY ("topup_id")
);

-- CreateTable
CREATE TABLE "public"."admin_action_log" (
    "action_id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "target_user" INTEGER,
    "target_vehicle_id" INTEGER,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_log_pkey" PRIMARY KEY ("action_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_number_key" ON "public"."user"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_id_key" ON "public"."user"("wallet_id");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_phone_number_idx" ON "public"."user"("phone_number");

-- CreateIndex
CREATE INDEX "user_user_type_idx" ON "public"."user"("user_type");

-- CreateIndex
CREATE INDEX "wallet_user_id_idx" ON "public"."wallet"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_user_id_key" ON "public"."driver"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_license_number_key" ON "public"."driver"("license_number");

-- CreateIndex
CREATE INDEX "driver_user_id_idx" ON "public"."driver"("user_id");

-- CreateIndex
CREATE INDEX "driver_license_number_idx" ON "public"."driver"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_license_plate_key" ON "public"."vehicle"("license_plate");

-- CreateIndex
CREATE INDEX "vehicle_driver_id_idx" ON "public"."vehicle"("driver_id");

-- CreateIndex
CREATE INDEX "vehicle_license_plate_idx" ON "public"."vehicle"("license_plate");

-- CreateIndex
CREATE INDEX "location_latitude_longitude_idx" ON "public"."location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "ride_user_id_idx" ON "public"."ride"("user_id");

-- CreateIndex
CREATE INDEX "ride_driver_id_idx" ON "public"."ride"("driver_id");

-- CreateIndex
CREATE INDEX "ride_status_idx" ON "public"."ride"("status");

-- CreateIndex
CREATE INDEX "ride_created_at_idx" ON "public"."ride"("created_at");

-- CreateIndex
CREATE INDEX "ride_review_target_driver_id_idx" ON "public"."ride_review"("target_driver_id");

-- CreateIndex
CREATE INDEX "ride_review_ride_id_idx" ON "public"."ride_review"("ride_id");

-- CreateIndex
CREATE INDEX "payment_user_id_idx" ON "public"."payment"("user_id");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "public"."payment"("status");

-- CreateIndex
CREATE INDEX "payment_created_at_idx" ON "public"."payment"("created_at");

-- CreateIndex
CREATE INDEX "user_device_user_id_idx" ON "public"."user_device"("user_id");

-- CreateIndex
CREATE INDEX "favorite_location_user_id_idx" ON "public"."favorite_location"("user_id");

-- CreateIndex
CREATE INDEX "log_user_id_idx" ON "public"."log"("user_id");

-- CreateIndex
CREATE INDEX "log_time_stamp_idx" ON "public"."log"("time_stamp");

-- CreateIndex
CREATE INDEX "delivery_request_sender_id_idx" ON "public"."delivery_request"("sender_id");

-- CreateIndex
CREATE INDEX "delivery_request_status_idx" ON "public"."delivery_request"("status");

-- CreateIndex
CREATE INDEX "delivery_request_created_at_idx" ON "public"."delivery_request"("created_at");

-- CreateIndex
CREATE INDEX "delivery_review_delivery_id_idx" ON "public"."delivery_review"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_review_target_driver_id_idx" ON "public"."delivery_review"("target_driver_id");

-- CreateIndex
CREATE INDEX "delivery_assignment_driver_id_idx" ON "public"."delivery_assignment"("driver_id");

-- CreateIndex
CREATE INDEX "wallet_transaction_wallet_id_idx" ON "public"."wallet_transaction"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transaction_type_idx" ON "public"."wallet_transaction"("type");

-- CreateIndex
CREATE INDEX "wallet_transaction_created_at_idx" ON "public"."wallet_transaction"("created_at");

-- CreateIndex
CREATE INDEX "wallet_transaction_status_idx" ON "public"."wallet_transaction"("status");

-- CreateIndex
CREATE INDEX "topup_request_wallet_id_idx" ON "public"."topup_request"("wallet_id");

-- CreateIndex
CREATE INDEX "topup_request_status_idx" ON "public"."topup_request"("status");

-- CreateIndex
CREATE INDEX "admin_action_log_admin_id_idx" ON "public"."admin_action_log"("admin_id");

-- CreateIndex
CREATE INDEX "admin_action_log_timestamp_idx" ON "public"."admin_action_log"("timestamp");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("wallet_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver" ADD CONSTRAINT "driver_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle" ADD CONSTRAINT "vehicle_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."driver"("driver_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle" ADD CONSTRAINT "vehicle_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."vehiclemodel"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle" ADD CONSTRAINT "vehicle_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_type"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride" ADD CONSTRAINT "ride_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride" ADD CONSTRAINT "ride_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."driver"("driver_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride" ADD CONSTRAINT "ride_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride" ADD CONSTRAINT "ride_drop_off_location_fkey" FOREIGN KEY ("drop_off_location") REFERENCES "public"."location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_status_history" ADD CONSTRAINT "ride_status_history_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."ride"("ride_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_review" ADD CONSTRAINT "ride_review_target_driver_id_fkey" FOREIGN KEY ("target_driver_id") REFERENCES "public"."driver"("driver_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_review" ADD CONSTRAINT "ride_review_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."ride"("ride_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_review" ADD CONSTRAINT "ride_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "public"."ride"("ride_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_method"("method_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_device" ADD CONSTRAINT "user_device_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorite_location" ADD CONSTRAINT "favorite_location_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorite_location" ADD CONSTRAINT "favorite_location_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."log" ADD CONSTRAINT "log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_request" ADD CONSTRAINT "delivery_request_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_request" ADD CONSTRAINT "delivery_request_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_request" ADD CONSTRAINT "delivery_request_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_request" ADD CONSTRAINT "delivery_request_drop_off_location_id_fkey" FOREIGN KEY ("drop_off_location_id") REFERENCES "public"."location"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_request" ADD CONSTRAINT "delivery_request_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "public"."vehicle_type"("type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_review" ADD CONSTRAINT "delivery_review_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."delivery_request"("delivery_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_review" ADD CONSTRAINT "delivery_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_review" ADD CONSTRAINT "delivery_review_target_driver_id_fkey" FOREIGN KEY ("target_driver_id") REFERENCES "public"."driver"("driver_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_assignment" ADD CONSTRAINT "delivery_assignment_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."delivery_request"("delivery_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_assignment" ADD CONSTRAINT "delivery_assignment_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."driver"("driver_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_status_history" ADD CONSTRAINT "delivery_status_history_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."delivery_request"("delivery_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transaction" ADD CONSTRAINT "wallet_transaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("wallet_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."topup_request" ADD CONSTRAINT "topup_request_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("wallet_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_action_log" ADD CONSTRAINT "admin_action_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_action_log" ADD CONSTRAINT "admin_action_log_target_user_fkey" FOREIGN KEY ("target_user") REFERENCES "public"."user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_action_log" ADD CONSTRAINT "admin_action_log_target_vehicle_id_fkey" FOREIGN KEY ("target_vehicle_id") REFERENCES "public"."vehicle"("vehicle_id") ON DELETE SET NULL ON UPDATE CASCADE;
