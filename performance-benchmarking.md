## **Performance Benchmarking Plan: Magic Checkout vs. Competitors**

Authors: [Arjun V C](mailto:arjun.vc@razorpay.com)

### **1\. Objective**

To systematically benchmark the end-to-end load performance of **Magic Checkout** against key competitors (e.g., **GoKwik**).

This plan has two primary goals:

1. **Comparative Analysis:** Objectively quantify *how much faster* (or slower) our checkout is at critical user-perceived checkpoints.  
2. **Diagnostic Deep-Dive:** Identify *internal bottlenecks* and optimization opportunities within our checkout flow.

### **2\. Core Methodology: Automation with Playwright**

We will use [**Playwright**](https://playwright.dev/) to automate all tests. This will allow us to:

* **Ensures Consistency:** Eliminates human variability in clicks and observation.  
* **Enables Control:** Allows us to precisely script test scenarios (login state) and environment conditions (network/CPU throttling).  
* **Provides Accurate Metrics:** We will use the browser's high-resolution [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) API directly from our script to get precise timings for custom metrics

### **3\. Benchmarking Checkpoints**

These checkpoints are "black-box" and will be measured for **all** products to ensure a fair comparison. The script will record the duration for each.

| Initial Checkout Page Load |  |  |  |
| ----- | :---- | :---- | :---- |
| **Checkpoint** | **Starts (Mark A)** | **Ends (Mark B)** | **Metric (Why it matters)** |
| **Click-to-Popup** | User click event | **FCP** (First Contentful Paint) of popup shell | **Responsiveness:** The first visual feedback. A delay here feels like a "broken button." |
| **Popup-to-Content** | FCP of popup shell | **LCP** (Largest Contentful Paint) in iframe | **Perceived Load Time:** The user's *true wait time* until the checkout is "useful." |
| **Content-to-Interactive** | LCP in iframe | Main thread is idle (via **TBT**) | **Usability:** Measures "jank." Can the user *actually* click a button or type, or is the UI frozen? |

### 

### **4\. Diagnostic Deep-Dive (Magic Checkout Only)**

For **Magic Checkout alone**, we will break down each checkpoint to find our internal bottlenecks. We will use **Playwright's [page.tracing](https://playwright.dev/docs/api/class-tracing)** to capture a full Chrome Trace file.

### **5\. Execution: Test Matrix**

The Puppeteer script will run a full suite of tests for **each** product, iterating through every combination in this matrix.

| Variable | Scenario 1 | Scenario 2 | Scenario 3 |
| :---- | :---- | :---- | :---- |
| **User State** | Logged Out (New User) | Logged In (Returning User) |  |
| **Network** | No Throttling | Fast 4G | Slow 4G |
| **CPU** | No Throttling | 4x Slowdown | 6x Slowdown |

### **6\. Custom Performance Metrics**

To get precise, application-specific measurements beyond standard Web Vitals, our Playwright script will use the PerformanceObserver API to capture custom metrics. We will define these metrics using a combination of modern browser APIs to pinpoint the exact moments of our checkout's lifecycle.

Here are the custom metrics we will track:

#### **1\. ClickToPopup**

* **What it Measures:** The time from the user's physical click on the "Checkout" button to the moment the *popup shell* first appears on the screen. This is the initial *Responsiveness* metric.  
* **APIs Used:**  
  * **User Timing API:** We will inject a performance.mark('click-start') on the mousedown or click event.  
  * **Element Timing API:** We will add an elementtiming="popup-shell" attribute to the main popup container. The observer will listen for this entry, giving us its renderTime.  
  * **Measurement:** performance.measure('ClickToPopup', 'click-start', 'popup-shell').

#### **2\. PopupToContent**

* **What it Measures:** The time from when the popup shell appears to when the *most important content within the iframe* is visible. This isolates the iframe's load performance from the parent page's click handler.  
* **APIs Used:**  
  * **Element Timing API:** This will be a measure between the popup-shell (from Metric 1\) and the lcp (see Metric 3\) timestamps.  
  * **Measurement:** performance.measure('PopupToContent', 'popup-shell', 'lcp').

#### **3\. ClickToContent**

* **What it Measures:** The *total perceived load time* for the user. It spans from the initial click to the "most important content" (e.g., Order Summary or Payment Methods) being fully visible inside the iframe.  
* **APIs Used:**  
  * **Element Timing API:** We will add elementtiming="lcp" to the primary content block *inside the iframe*.  
  * **Measurement:** performance.measure('ClickToContent', 'click-start', 'lcp').

#### **4\. TotalBlockingTime**

* **What it Measures:** The total time the main thread was *frozen* by tasks taking longer than 50ms *during the load process*. This is a primary indicator of "jank" and directly impacts interactivity.  
* **APIs Used:**  
  * **Long Tasks API:** The PerformanceObserver will listen for longtask entries and sum their durations. This will be a key metric for the **Content-to-Interactive** checkpoint.

#### **5\. ContentToInteractive**

* **What it Measures:** This isn't a single duration but a state we verify. It represents the time from when the main content is visible (cp) until the main thread is *idle* and can reliably respond to user input.  
* **APIs Used:**  
  * **Long Tasks API:** We will measure this by identifying the timestamp of the *last long task* that occurs after the lcp timestamp. A large TotalBlockingTime (Metric 4\) directly increases this duration.

#### **6\. InteractionDelay**

* **What it Measures:** The *post-load* responsiveness. It measures the latency of the *slowest* interaction (e.g., clicking a payment method, typing in a coupon) from the user's input to the next frame being painted.  
* **APIs Used:**  
  * **Event Timing API:** After the load, our script will *simulate* clicks. We will observe event entries and find the longest duration (the full time from input to paint).  
  * **Long Animation Frames (LoAF) API:** For our internal *diagnostic* build, we will use LoAF to get rich, debuggable information on *what* script is causing any interaction delays.

### **7\. Deliverables**

1. A Google sheet with the collected metrics

