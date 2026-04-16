
<div align="center">
  <img src="https://raw.githubusercontent.com/Mark-Lasfar/naseej-system/e36045a580c7989c6490e19f87edfbca814b9fda/public/logo-dark.svg" alt="Naseej Logo" width="180"/>
  <h1 align="center">Naseej | Integrated Management System</h1>
  <p align="center">
    <strong>A complete digital ecosystem for modern carpets and textiles businesses</strong>
  </p>
  <p align="center">
    <a href="https://naseej-system.vercel.app" target="_blank">🌐 Live Demo</a> •
    <a href="#-key-features">✨ Key Features</a> •
    <a href="#-getting-started">🚀 Getting Started</a> •
    <a href="#-technology-stack">🛠️ Tech Stack</a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version 1.0.0"/>
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT"/>
    <img src="https://img.shields.io/badge/Node.js-24.x-339933" alt="Node.js 24.x"/>
    <img src="https://img.shields.io/badge/React-18.2.0-61DAFB" alt="React 18.2.0"/>
  </p>
</div>

---

## 📖 Overview

**Naseej** is a comprehensive, open-source management platform designed specifically for the carpets and textiles industry. It bridges the gap between traditional manufacturing, modern e-commerce, and community engagement. The system empowers businesses to manage their entire operation—from AI-assisted product design and machine integration to online sales, customer communication, and social interaction—all from a single, intuitive interface.

> **Note:** While the source code is open for learning and contribution, the core business logic, unique algorithms, and proprietary integrations are the intellectual property of the project maintainers.

## ✨ Key Features

### 🛍️ Multi-Vendor Marketplace
- **Seller Stores:** Any user can create their own branded store with a custom logo, cover image, and description.
- **Product Management:** Sellers can add products with multiple images, videos, detailed specifications, and pricing.
- **Advanced Search & Filters:** Customers can filter products by store, category, material, price range, and more.
- **Shopping Cart & Checkout:** Seamless cart experience with coupon support and real-time shipping cost calculation.

### 💳 Flexible Payment System
- **Multiple Gateways:** Supports Cash on Delivery, PayPal, Stripe (Credit/Debit Cards), Vodafone Cash, InstaPay, and Bank Transfers.
- **Seller Payouts:** Sellers can add their own payment methods (bank, PayPal, mobile wallet) and request withdrawals.
- **Secure Transactions:** All payments are processed through industry-standard secure gateways.

### 🏪 Store Management for Sellers
- **Store Dashboard:** Sellers get a dedicated dashboard with analytics (total products, sales, revenue, store views).
- **Order Management:** View and update the status of orders placed in their store.
- **Payout Settings:** Manage payout methods, view transaction history, and request withdrawals.

### 💬 Real-Time Chat System
- **Instant Messaging:** Send and receive messages in real-time with typing indicators and read receipts.
- **Rich Features:** Reply to specific messages, add emoji reactions, edit/delete your own messages.
- **Search:** Search within a conversation to quickly find past messages.
- **Shared Media:** View all images and videos shared in a conversation.
- **Customizable Experience:** Users can personalize their chat theme (message colors, background, font).

### 📱 Social & Community Features
- **Social Feed:** A dedicated feed (`/feed`) where users can view posts from stores they follow or trending content.
- **Create Posts:** Users can publish text, image, or video posts with hashtags and privacy settings (public, followers only, private).
- **Engagement:** Like, comment on, and share posts. Get notifications for interactions.
- **Stories:** Share temporary, 24-hour photo or video stories, similar to Instagram.
- **Follow Stores:** Follow your favorite sellers to see their updates and posts.

### 🎨 AI Design Studio (Innovation Hub)
- **AI-Generated Designs:** Users can input parameters (dimensions, colors, pattern style) and an AI model generates a unique carpet design.
- **3D Preview:** Get a realistic 3D visualization of the design.
- **Cost Estimation:** The system automatically calculates an estimated cost based on materials, labor, and pattern complexity.
- **Material Library:** Browse a catalog of available materials (wool, silk, cotton, etc.) with details on price, durability, and softness.
- **Machine Integration:** Export the final design as machine-readable instructions (G-code) to be sent directly to CNC looms or other manufacturing equipment.

### 🤖 Smart Manufacturing Integration
- **Machine Profiles:** Register and manage manufacturing machines (CNC looms, Jacquard, etc.).
- **G-Code Generation:** Automatically generate the necessary G-code instructions from an approved design.
- **Production Tracking:** Monitor the progress of designs sent to production.

### 👑 Admin Control Panel
- **Full Oversight:** Admins have access to manage all products, customers, invoices, and orders.
- **Platform Management:** Manage coupon codes, shipping rates, and the material/pattern libraries.
- **User & Store Moderation:** Oversee all user activity and store operations.

## 🚀 Getting Started

These instructions will help you set up a development or production instance of the Naseej platform.

### Prerequisites
- Node.js (version 24.x or higher)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn package manager
- Accounts for: Cloudinary (image/video hosting), Stripe & PayPal (payments), (Optional) MQTT broker for machine integration.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Mark-Lasfar/naseej-system.git
    cd naseej-system
    ```

2.  **Set up the Backend**
    ```bash
    cd backend
    npm install
    cp .env.example .env  # Create your environment file
    ```
    - You must edit the `.env` file and add your own API keys and credentials (MongoDB URI, Cloudinary keys, Stripe keys, etc.).
    - **Important:** The core AI design logic and some proprietary integration methods are not included in the public repository to protect intellectual property.

3.  **Set up the Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Run the development servers**
    - **Backend:** From the `backend` folder, run `npm run dev`
    - **Frontend:** From the `frontend` folder, run `npm start`
    - The application will open at `http://localhost:3000`

### Deployment
The project is configured for easy deployment on platforms like **Vercel** (for the frontend) and **Render** or **Railway** (for the backend). Refer to the platform-specific documentation for deployment steps. The live demo is hosted at [naseej-system.vercel.app](https://naseej-system.vercel.app).

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Backend Framework** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) |
| **Frontend Library** | React 18 |
| **Styling** | TailwindCSS, Framer Motion (for animations) |
| **State Management & API Calls** | React Hooks, Axios |
| **Payments** | Stripe, PayPal, Vodafone Cash API |
| **Media Storage** | Cloudinary |
| **Real-time Features** | Polling (for chat) |
| **Manufacturing Interface** | MQTT, TCP Sockets |

## 🌟 Why Naseej?

- **All-in-One Solution:** Combines e-commerce, social networking, and manufacturing management in one system.
- **Industry-Specific:** Tailored for the carpets and textiles sector, not a generic ERP.
- **Scalable:** Designed to grow from a single seller to a multi-vendor marketplace.
- **Community-Driven:** The social features build a community around your brand and sellers.
- **Future-Ready:** Integrates AI for design and IoT for manufacturing.




## 📚 Documentation & System Architecture

<div align="center">
  <a href="https://github.com/Mark-Lasfar/naseej-system/tree/main/docs">
    <img width="600" alt="Chat System Architecture" src="https://github.com/user-attachments/assets/c17e6230-449d-4440-aeea-87e17c8a0dfc" />
  </a>
  <p><em>📸 Real-time Chat System Architecture (Click image for full documentation)</em></p>
</div>

### 📖 Technical Documentation

For complete system documentation including architecture diagrams, sequence flows, database schemas, and deployment guides, please visit the **[Documentation Section](https://github.com/Mark-Lasfar/naseej-system/tree/main/docs)**.

| Document Type | Description |
|---------------|-------------|
| 🏗️ **Architecture** | System component diagrams and interactions |
| 🔄 **Message Flow** | Sequence diagrams for message delivery |
| 💾 **Database Schema** | Complete data models and relationships |
| 🔌 **Socket.IO** | WebSocket connection lifecycle |
| 📋 **Features** | Complete feature inventory |
| 🚀 **Deployment** | Step-by-step deployment instructions |

> **Access:** The full documentation is available in the `/docs` directory of the repository. Clone the repository or view it directly on GitHub.


## 🤝 Contributing

We welcome contributions to enhance the Naseej platform. If you'd like to contribute, please:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

Please note that we have a strict code of conduct and contribution guidelines to ensure a collaborative and respectful environment.

## 📄 License

Distributed under the MIT License. See `LICENSE` file for more information. The license applies to the codebase, but the specific business logic and proprietary algorithms remain the intellectual property of the project owner.

## 📞 Contact & Support

- **Project Maintainer:** Mark Lasfar
- **Live Demo:** [naseej-system.vercel.app](https://naseej-system.vercel.app)
- **GitHub Repository:** [https://github.com/Mark-Lasfar/naseej-system](https://github.com/Mark-Lasfar/naseej-system)

For support, inquiries, or partnership opportunities, please open an issue on the GitHub repository or contact the maintainer directly.

---

<div align="center">
  <sub>Built with ❤️ for the carpets & textiles industry.</sub>
</div>