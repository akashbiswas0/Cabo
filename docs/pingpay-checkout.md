# Quick Start

The Pingpay API is designed to be simple and easy to integrate, while supporting both hosted and programmatic payment flows. This page provides everything needed to make your first authenticated request and helps choose the correct integration path for your use case.

**API Checkout Example Repo:** <https://github.com/Pingpayio/ping-checkout-example>\
\
Ensure to review [Merchant Dashboard](https://pingpay.gitbook.io/docs/pingpay-api/developer-dashboard) before integration to access API keys and configurations.

## **Authentication**

All API requests must include a **Publishable API Key**, which identifies the merchant or integration making the request.

Publishable keys are passed via the `x-publishable-key` header.

#### **Header Example**

```http
x-publishable-key: pk_test_123456
```

If the key is missing or invalid, the API will return:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "Invalid or missing publishable key."
}
```

#### **Notes**

* Never commit API keys to public repositories.
* Store keys in environment variables or secure configuration systems.

***

## **Base URL**

All API requests should be made against the following base URL:

```
https://pay.pingpay.io/api
```

***

## Choose Your Integration Path

The Pingpay API supports two primary integration paths. Your first API call depends on which model you choose.

***

### Option 1: Hosted Checkout

Hosted Checkout is the fastest way to accept payments.

In this model, you:

* Create a checkout session via the API
* Redirect the user to a Pingpay-hosted checkout page
* Optionally retrieve the session to confirm final status

Your first API call is:

```shellscript
POST /checkout/sessions
```

See [Hosted Checkout](https://pingpay.gitbook.io/docs/pingpay-api/hosted-checkout) for the full flow.

***

### Option 2: Headless Payments

Headless Payments provide a lower-level, intent-based payment flow.

In this model, you:

* Prepare a payment request (including fee estimation)
* Collect a signature or authorisation from the payer
* Submit the signed payload for execution
* Retrieve and track payment status programmatically

Your first API call is:

```shellscript
POST /payments/prepare
```

See [Headless Payments](https://pingpay.gitbook.io/docs/pingpay-api/headless-payments) for the full flow.



# Hosted Checkout

***

Pingpay Hosted Checkout provides a simple, redirect-based way to accept crypto & fiat payments without managing wallets, signing flows, or on-chain execution.

In this model, Pingpay handles the entire payment experience through a hosted checkout page, while your application is responsible for creating checkout sessions and confirming their status.

#### How it works

1. Create a checkout session using the API
2. Redirect the user to the Pingpay-hosted checkout page
3. Receive the user back on your success or cancel URL
4. Retrieve the checkout session to confirm final status

**Hosted Checkout is ideal for:**

* Merchants who want a fast integration
* Applications that prefer redirect-based payment flows
* Use cases where Pingpay manages payment execution end-to-end


# Create Checkout

***

## **Create Checkout Session**

The `POST /checkout/sessions` endpoint is used to create a new hosted checkout session.<br>

A checkout session represents a pending payment intent that a customer can complete using the Pingpay hosted checkout experience. Once created, the API returns a `sessionUrl` that the user should be redirected to in order to complete payment.

***

### **Endpoint**

```shellscript
POST /checkout/sessions
```

***

### **Headers**

```http
x-api-key: pk_test_123456
Content-Type: application/json
```

***

### **Request Body**

The request body follows the structure defined in the OpenAPI specification:

```json
{
  "amount": "1000000",
  "asset":{
    "chain":"NEAR",
    "symbol":"USDC",
  },
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "metadata": {
    "orderId": "12345"
  }
}
```

#### **Required fields**

* `amount`
* `recipient`

All other fields are optional.

***

### **Response**

A successful request returns:

```json
{
  "session": {
    "sessionId": "cs_123",
    "status": "CREATED",
    "paymentId": null,
    "amount": {
      "assetId": "nep141:wrap.near",
      "amount": "1000000000000000000000000"
    },
    "recipient": {
      "address": "example.near",
    },
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:15:00.000Z",
    "metadata": {
      "orderId": "12345",
    }
  },
  "sessionUrl": "https://checkout.pingpay.io/session/cs_123"
}
```

#### **Key fields**

* `sessionId` — Unique identifier for the checkout session
* `sessionUrl` — URL to redirect the user to complete payment
* `status` — Initial value is `CREATED`
* `paymentId` — Identifier of the resulting payment, if and when one is created
* `expiresAt` — Optional expiration timestamp for the checkout session

> **Note:**\
> The `sessionUrl` should be treated as an **opaque value** and used exactly as returned by the API. Do not attempt to construct this URL manually.

***

#### Notes

* Creating a checkout session does **not** execute a payment immediately
* The payment is completed by the user via the Pingpay-hosted checkout page
* The `paymentId` field may be `null` until the checkout flow has completed
* Checkout sessions may expire if not completed within the configured time window

***

### **Error Response Example**

```json
{
  "code": "INVALID_PUBLISHABLE_KEY",
  "message": "Publishable key is invalid."
}
```

***


# Retrieve Checkout

***

## **Retrieve Checkout Session**

The `GET /checkout/sessions/{sessionId}` endpoint retrieves the current state of an existing checkout session.&#x20;

This endpoint is typically used to:

* Confirm the final status of a checkout after redirect
* Poll for updates on a pending session
* Display checkout details in an application

Retrieving a checkout session does not execute or modify a payment. It only returns the current session state.

***

### **Endpoint**

```shellscript
GET /checkout/sessions/{sessionId}
```

***

### **Headers**

```http
x-publishable-key: pk_test_123456
```

***

### **Path Parameter**

| Name        | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| `sessionID` | string | Yes      | The unique ID of the checkout session |

Example:

```shellscript
GET /checkout/sessions/cs_123
```

***

### **Response**

A successful response returns the checkout session object.

```json
{
  "session": {
    "sessionId": "cs_123",
    "status": "PENDING",
    "paymentId": "pay_456",
    "amount": {
      "assetId": "nep141:wrap.near",
      "amount": "1000000000000000000000000"
    },
    "recipient": {
      "address": "example.near",
      "chainId": "near-mainnet"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:15:00.000Z",
    "sessionUrl": "https://checkout.pingpay.io/session/cs_123"
  }
}
```

#### **Key fields**

* `status` — current state of the checkout session; may be one of:\
  `CREATED`, `PENDING`, `COMPLETED`, `EXPIRED`, `CANCELLED`
* `paymentId` — Identifier of the resulting payment, if one has been created
* `expiresAt` — Optional expiration timestamp for the session
* `sessionUrl` — Redirect URL for the hosted checkout (if still active)

***

#### **Notes:**

* This endpoint is **read-only**
* A `COMPLETED` status indicates the checkout flow finished successfully
* A `COMPLETED` checkout may be associated with a `paymentId`
* Use the Payments API to retrieve or track the payment itself, if required

***

### **Error Response Example**

```json
{
  "code": "NOT_FOUND",
  "message": "Checkout session not found."
}
```

# Headless Payments

***

#### What are  Headless Payments?

Headless Payments provide a low-level, intent-based way to create and execute crypto and fiat payments using the Pingpay API.

Unlike Hosted Checkout, Headless Payments do not involve a redirect or Pingpay-hosted user interface. Instead, your application is responsible for preparing payment intents, collecting signatures or authorisations, and submitting payments for execution.

This integration path is designed for applications that desire **full control over the payment flow**.

***

#### When to use Headless Payments

Headless Payments are ideal for:

* Wallets and power-user applications
* Agent-based or automated payment flows
* Custom checkout experiences
* Use cases where signing and execution must be controlled explicitly


# Prepare Payment

***

### **Prepare a Payment** <a href="#retrieve-checkout-session" id="retrieve-checkout-session"></a>

The `POST /payments/prepare` endpoint creates a **payment intent**.

Preparing a payment defines *what* will be paid, *by whom*, and *to whom*, but **does not execute the payment**. This step validates the request, calculates fees, and returns a `paymentId` that is later used to submit and track the payment.

This endpoint is the **first step** in all headless payment flows.

***

### Endpoint

```shellscript
POST /payments/prepare
```

***

### Headers

```http
x-publishable-key: pk_test_123456
Content-Type: application/json
```

***

### Request Body

```json
{
  "payer": {
    "address": "payer.near",
    "chainId": "near-mainnet"
  },
  "recipient": {
    "address": "example.near",
    "chainId": "near-mainnet"
  },
  "asset": {
    "assetId": "nep141:wrap.near",
    "amount": "1000000000000000000000000"
  },
  "idempotencyKey": "order_12345",
  "memo": "Invoice #12345"
}
```

#### **Required fields**

* `payer`
* `recipient`
* `asset`
* `idempotencyKey`

***

### Idempotency

The `idempotencyKey` ensures that repeated requests with the same key **do not create duplicate payment intents**.

* Use a unique, deterministic value per payment (e.g. order ID)
* Reusing the same key will return the original prepared payment
* This allows safe retries in the event of network failures

Idempotency is **required** for this endpoint.

***

### Response

A successful request returns the prepared payment intent.

```json
{
  "payment": {
    "paymentId": "pay_456",
    "status": "PENDING",
    "payer": {
      "address": "payer.near",
      "chainId": "near-mainnet"
    },
    "recipient": {
      "address": "example.near",
      "chainId": "near-mainnet"
    },
    "asset": {
      "assetId": "nep141:wrap.near",
      "amount": "1000000000000000000000000"
    },
    "feeQuote": {
      "totalFee": "1000000000000000000000"
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### **Key Fields**

* `paymentId` — Unique identifier for the prepared payment
* `status` — Initial value is `PENDING`
* `feeQuote.totalFee` — Estimated total fees for executing the payment

***

#### **Notes**

* Preparing a payment **does not move funds**
* No blockchain transaction is submitted at this stage
* The returned `paymentId` must be used when submitting the payment
* Fees may vary depending on execution conditions

***

### Error Response Example

```json
{
  "code": "INVALID_REQUEST",
  "message": "Invalid payment parameters."
}

```


# Submit Payment

***

### Submit a Payment

The `POST /payments/submit` endpoint executes a previously prepared payment.

Submitting a payment is the step where funds are actually moved. This endpoint takes a prepared `paymentId` and submits it for execution on the underlying networks.

You **must prepare a payment first** using the Prepare Payment endpoint before submitting it.

***

### Endpoint

```shellscript
POST /payments/submit
```

***

### Headers

```http
x-publishable-key: pk_test_123456
Content-Type: application/json
```

***

### Request Body

```json
{
  "paymentId": "pay_456",
  "idempotencyKey": "order_12345",
  "signedPayload": "0xabcdef..."
}
```

#### Required Fields

* `paymentId` — The identifier returned from the prepare step
* `idempotencyKey` — Used to prevent duplicate execution
* `signedPayload` — Authorisation or signature required to execute the payment

***

### Signing and Authorisation

Submitting a payment typically requires a **signature or signed payload** from the payer.

The exact signing mechanism depends on:

* the payer’s wallet
* the underlying blockchain(s)
* the execution strategy

Pingpay does not generate signatures on behalf of the payer. Your application is responsible for obtaining and providing the required payment authorisation.

***

### Idempotency

The `idempotencyKey` ensures that retrying a submit request does **not result in duplicate execution**.

* Use the same idempotency key that was used during preparation
* Repeating the request with the same key will return the existing execution result
* This allows safe retries if network errors occur

Idempotency is **required** for this endpoint.

***

### Response

A successful request returns the updated payment object.

```json
{
  "payment": {
    "paymentId": "pay_456",
    "status": "PENDING",
    "payer": {
      "address": "payer.near",
      "chainId": "near-mainnet"
    },
    "recipient": {
      "address": "example.near",
      "chainId": "near-mainnet"
    },
    "asset": {
      "assetId": "nep141:wrap.near",
      "amount": "1000000000000000000000000"
    },
    "updatedAt": "2025-01-01T00:01:00.000Z"
  }
}
```

***

### Payment Status

After submission, the payment status reflects execution progress.

The payment status will be one of:

* `PENDING` — Execution has been initiated
* `SUCCESS` — Payment completed successfully
* `FAILED` — Payment failed during execution

Final status should be confirmed by retrieving the payment.

***

#### Notes

* Submitting a payment **initiates execution**
* This operation should be treated as **non-reversible**
* Always use idempotency keys when retrying
* Do not submit the same payment with different idempotency keys

***

### Error Response Example

```json
{
  "code": "INVALID_PAYMENT_STATE",
  "message": "Payment cannot be submitted in its current state."
}
```


# Submit Payment

***

### Submit a Payment

The `POST /payments/submit` endpoint executes a previously prepared payment.

Submitting a payment is the step where funds are actually moved. This endpoint takes a prepared `paymentId` and submits it for execution on the underlying networks.

You **must prepare a payment first** using the Prepare Payment endpoint before submitting it.

***

### Endpoint

```shellscript
POST /payments/submit
```

***

### Headers

```http
x-publishable-key: pk_test_123456
Content-Type: application/json
```

***

### Request Body

```json
{
  "paymentId": "pay_456",
  "idempotencyKey": "order_12345",
  "signedPayload": "0xabcdef..."
}
```

#### Required Fields

* `paymentId` — The identifier returned from the prepare step
* `idempotencyKey` — Used to prevent duplicate execution
* `signedPayload` — Authorisation or signature required to execute the payment

***

### Signing and Authorisation

Submitting a payment typically requires a **signature or signed payload** from the payer.

The exact signing mechanism depends on:

* the payer’s wallet
* the underlying blockchain(s)
* the execution strategy

Pingpay does not generate signatures on behalf of the payer. Your application is responsible for obtaining and providing the required payment authorisation.

***

### Idempotency

The `idempotencyKey` ensures that retrying a submit request does **not result in duplicate execution**.

* Use the same idempotency key that was used during preparation
* Repeating the request with the same key will return the existing execution result
* This allows safe retries if network errors occur

Idempotency is **required** for this endpoint.

***

### Response

A successful request returns the updated payment object.

```json
{
  "payment": {
    "paymentId": "pay_456",
    "status": "PENDING",
    "payer": {
      "address": "payer.near",
      "chainId": "near-mainnet"
    },
    "recipient": {
      "address": "example.near",
      "chainId": "near-mainnet"
    },
    "asset": {
      "assetId": "nep141:wrap.near",
      "amount": "1000000000000000000000000"
    },
    "updatedAt": "2025-01-01T00:01:00.000Z"
  }
}
```

***

### Payment Status

After submission, the payment status reflects execution progress.

The payment status will be one of:

* `PENDING` — Execution has been initiated
* `SUCCESS` — Payment completed successfully
* `FAILED` — Payment failed during execution

Final status should be confirmed by retrieving the payment.

***

#### Notes

* Submitting a payment **initiates execution**
* This operation should be treated as **non-reversible**
* Always use idempotency keys when retrying
* Do not submit the same payment with different idempotency keys

***

### Error Response Example

```json
{
  "code": "INVALID_PAYMENT_STATE",
  "message": "Payment cannot be submitted in its current state."
}
```


# API Payment Examples

***

### Example 1: Hosted Checkout Flow

This example shows the full flow for accepting a payment using **Pingpay Hosted Checkout**.

#### Step 1: Create a Checkout Session

```http
POST https://pay.pingpay.io/api/checkout/sessions
x-publishable-key: pk_test_123456
Content-Type: application/json
```

```json
{
  "amount": {
    "assetId": "nep141:wrap.near",
    "amount": "1000000000000000000000000"
  },
  "recipient": {
    "address": "example.near",
    "chainId": "near-mainnet"
  },
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

#### Step 2: Redirect the User

From the response, retrieve the `sessionUrl` and redirect the user to it:

```
https://checkout.pingpay.io/session/cs_123
```

The user completes the payment on the Pingpay-hosted checkout page.

***

#### Step 3: Retrieve the Checkout Session

After the user is redirected back to your `successUrl`, retrieve the session to confirm final status.

```http
GET https://pay.pingpay.io/api/checkout/sessions/cs_123
x-publishable-key: pk_test_123456
```

```json
{
  "session": {
    "sessionId": "cs_123",
    "status": "COMPLETED",
    "paymentId": "pay_456"
  }
}
```

Once the session status is `COMPLETED`, the payment can be considered successful.

***

### Example 2: Headless Payment Flow

This example shows how to execute a payment using **Headless Payments** without a hosted checkout.

***

#### Step 1: Prepare a Payment

```http
POST https://pay.pingpay.io/api/payments/prepare
x-publishable-key: pk_test_123456
Content-Type: application/json
```

```json
{
  "payer": {
    "address": "payer.near",
    "chainId": "near-mainnet"
  },
  "recipient": {
    "address": "example.near",
    "chainId": "near-mainnet"
  },
  "asset": {
    "assetId": "nep141:wrap.near",
    "amount": "1000000000000000000000000"
  },
  "idempotencyKey": "order_12345"
}
```

Response:

```json
{
  "payment": {
    "paymentId": "pay_456",
    "status": "PENDING"
  }
}
```

***

#### Step 2: Submit the Payment

After preparing the payment and collecting the required signature or authorisation from the payer, submit the payment for execution.

```http
POST https://pay.pingpay.io/api/payments/submit
x-publishable-key: pk_test_123456
Content-Type: application/json
```

```json
{
  "paymentId": "pay_456",
  "idempotencyKey": "order_12345",
  "signedPayload": "0xabcdef..."
}
```

Response:

```json
{
  "payment": {
    "paymentId": "pay_456",
    "status": "PENDING"
  }
}
```

***

#### Step 3: Retrieve the Payment

Poll the payment until it reaches a final state.

```http
GET https://pay.pingpay.io/api/payments/pay_456
x-publishable-key: pk_test_123456
```

```json
{
  "payment": {
    "paymentId": "pay_456",
    "status": "SUCCESS"
  }
}
```

Once the status is `SUCCESS`, the payment is complete and can be fulfilled.

***

