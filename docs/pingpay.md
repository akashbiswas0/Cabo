code example for onramp

import { PingpayOnramp, type PingpayOnrampConfig } from "@pingpay/onramp-sdk";

const openOnrampButton = document.getElementById("openOnrampButton");

if (openOnrampButton) {
  openOnrampButton.addEventListener("click", () => {
    try {
      const targetAssetDetails = { chain: "NEAR", asset: "wNEAR" };
      const onrampOptions: PingpayOnrampConfig = {
        // Example appFees: 100 basis points = 1%
        appFees: [
          {
            recipient: "fees.pingpayio.near",
            fee: 25,
          },
        ],
        onPopupReady: () => console.log("Example: Popup is ready"),
        onPopupClose: () => console.log("Example: Popup was closed"),
      };

      if (import.meta.env.POPUP_URL) {
        // override for local development
        onrampOptions.popupUrl = import.meta.env.POPUP_URL;
      }

      const onramp = new PingpayOnramp(onrampOptions);
      onramp.initiateOnramp(targetAssetDetails);
    } catch (error) {
      console.error("Error initializing or opening PingPay Onramp:", error);
      const errorElement = document.getElementById("errorMessage");
      if (errorElement && error instanceof Error) {
        errorElement.textContent = `Failed to open PingPay Onramp: ${error.message}. Check console.`;
      } else if (errorElement) {
        errorElement.textContent =
          "Failed to open PingPay Onramp. Check console for details.";
      }
    }
  });
} else {
  console.error("Could not find the #openOnrampButton element.");
}

const appElement = document.getElementById("app");
if (appElement) {
  const errorMessageElement = document.createElement("p");
  errorMessageElement.id = "errorMessage";
  errorMessageElement.style.color = "red";
  appElement.appendChild(errorMessageElement);
}


## context for the LLM

# Ping Onramp SDK

***

The Ping Onramp SDK provides a simple way to integrate cryptocurrency onramp functionality into your application. It allows users to purchase cryptocurrency using fiat payment methods through a popup flow. \
\
Developers only need to specify the **target asset** the user should receive. The SDK handles opening the onramp flow via a popup, managing the user journey, and returning a structured result once a purchase completes or fails.&#x20;

**Onramp Example Repo:** [https://github.com/Pingpayio/ping-onramp-sdk](https://github.com/Pingpayio/ping-onramp-example)

This section focuses only on SDK integration and customisation.&#x20;

***

### Installation

{% code overflow="wrap" %}

```bash
npm install @pingpay/onramp-sdk
```

{% endcode %}

***

### Quick Start

```typescript
import type { TargetAsset, OnrampResult } from "@pingpay/onramp-sdk";
import { PingpayOnramp, PingpayOnrampError } from "@pingpay/onramp-sdk";

const onramp = new PingpayOnramp();

const targetAsset: TargetAsset = {
  chain: "NEAR",
  asset: "wNEAR",
};

async function handleOnramp() {
  try {
    const result: OnrampResult = await onramp.initiateOnramp(targetAsset);
    console.log("Onramp successful:", result);
  } catch (error) {
    if (error instanceof PingpayOnrampError) {
      console.error("Onramp failed:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

document
  .getElementById("onrampButton")
  ?.addEventListener("click", handleOnramp);
```

```html
<button id="onrampButton">Buy Crypto</button>
```

***

### API Reference

`PingpayOnramp`

The main class for interacting with the Ping Onramp service.

***

#### Constructor

```typescript
constructor(config?: PingpayOnrampConfig)
```

Creates a new instance of the Ping Onramp SDK. \
\
The configuration object is optional and allows you to customise the onramp experience, such as defining a default target asset, applying application fees, or responding to popup lifecycle events.

***

#### Configuration Options

The `PingpayOnrampConfig` object supports the following properties:

| Property       | Type            | Description                                                       |
| -------------- | --------------- | ----------------------------------------------------------------- |
| `targetAsset`  | `TargetAsset`   | Optional default target asset for the onramp flow                 |
| `appFees`      | `OneClickFee[]` | Optional application fees applied to the onramp (in basis points) |
| `popupURL`     | `string`        | Optional custom popup URL (useful for development and testing)    |
| `onPopupReady` | `() => void`    | Called when the popup window signals it is ready                  |
| `onPopupClose` | `() => void`    | Called when the popup window is closed                            |

***

### Methods

**`initiateOnramp`**

```ts
initiateOnramp(target?: TargetAsset): Promise<OnrampResult>
```

Initiates the onramp process for the specified target asset. This opens a popup window that guides the user through the onramp flow.

If no `target` is provided, the SDK will use the `targetAsset` defined in the constructor configuration. If neither is provided, the user may be prompted to select an asset in the popup.

**Parameters:**

* `target`: Optional target asset specifying the chain and asset the user should receive

**Returns:**

* A Promise that resolves with an `OnrampResult` when the onramp completes successfully

**Throws:**

* `PingpayOnrampError` when:
  * The popup fails to open
  * The user closes the popup before completion
  * The onramp flow fails at any step
  * The SDK instance has been closed

**`close`**

```ts
close(): void
```

Closes the onramp popup (if open) and cleans up internal resources.\
If defined, the `onPopupClose` callback will be triggered.

This is useful if your application needs to interrupt the onramp flow programmatically.

***

#### Types

**`TargetAsset`**

The `TargetAsset` type specifies which cryptocurrency the user wants to purchase (onramp into).

```typescript
type TargetAsset = {
  chain: string;   // Target blockchain (e.g. "NEAR", "ETH", "SOL")
  asset: string;   // Asset symbol (e.g. "NEAR", "USDC")
};
```

**Examples:**

```typescript
// NEAR native token
const targetAsset = { chain: "NEAR", asset: "NEAR" };

// Ethereum USDC token
const targetAsset = { chain: "ETH", asset: "USDC" };
```

**`OnrampResult`**

The result returned after a successful onramp process.

```typescript
type OnrampResult = {
  type: "intents";
  action: "withdraw";
  depositAddress: string;
  network: string;
  asset: string;
  amount: string;
  recipient: string;
};
```

This result represents an intents-based withdrawal instruction after the fiat onramp has completed.

**`OneClickFee`**

Used to configure application fees for the onramp.

```typescript
type OneClickFee = {
  recipient: string; // Fee recipient address
  fee: number;       // Fee in basis points (100 = 1%)
};
```

**`PingpayOnrampError`**

Errors thrown by the SDK extend the `PingpayOnrampError` class.

```typescript
class PingpayOnrampError extends Error {
  message: string;
  details?: unknown;
  step?: string;
}
```

***

#### Error Handling

The SDK throws `PingpayOnrampError` instances when errors occur during the onramp flow.

```typescript
try {
  await onramp.initiateOnramp({ chain: "NEAR", asset: "wNEAR" });
} catch (error) {
  if (error instanceof PingpayOnrampError) {
    console.error(`Onramp failed: ${error.message}`);
    console.debug("Step:", error.step);
    console.debug("Details:", error.details);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

***

### Example: Complete Integration

Here's a complete example showing how to integrate the SDK into an application:

```typescript
import { PingpayOnramp, PingpayOnrampError } from "@pingpay/onramp-sdk";

const button = document.getElementById("openOnrampButton");

button?.addEventListener("click", async () => {
  const onramp = new PingpayOnramp({
    targetAsset: { chain: "NEAR", asset: "wNEAR" },
    onPopupReady: () => console.log("Popup ready"),
    onPopupClose: () => console.log("Popup closed"),
  });

  try {
    const result = await onramp.initiateOnramp();
    console.log("Onramp successful:", result);
  } catch (error) {
    if (error instanceof PingpayOnrampError) {
      console.error("Onramp failed:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
});
```


