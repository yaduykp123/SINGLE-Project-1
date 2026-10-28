import orderReducer, {
  addOrder,
  addReceivedOrder,
  updateOrderStatusInState,
  setMyOrders,
  setReceivedOrders,
} from "../redux/slices/orderSlice";

import notificationReducer, {
  addNotification,
  setNotifications,
  markSingleAsRead,
  markAllAsReadState,
} from "../redux/slices/notificationSlice";

import offerReducer, {
  addOffer,
  removeOffer,
  updateOfferInState,
  setOffers,
} from "../redux/slices/offerSlice";

describe("Real-time State Synchronization & Instant UI Updates", () => {
  describe("Order Synchronization (Buyer <-> Seller)", () => {
    const initialOrderState = {
      myOrders: [],
      receivedOrders: [],
      currentOrder: null,
      loading: false,
      error: null,
    };

    it("should instantly add placed order to buyer myOrders without duplicates (Test A)", () => {
      const order = { _id: "ord_101", productName: "Organic Milk", quantity: 2, totalAmount: 160 };
      const state1 = orderReducer(initialOrderState, addOrder(order));

      expect(state1.myOrders.length).toBe(1);
      expect(state1.myOrders[0]._id).toBe("ord_101");

      // Idempotency: Duplicate socket event should not produce duplicate cards
      const state2 = orderReducer(state1, addOrder(order));
      expect(state2.myOrders.length).toBe(1);
    });

    it("should instantly add new order to seller receivedOrders without page refresh (Test B)", () => {
      const sellerOrder = {
        _id: "ord_202",
        productName: "Artisan Bread",
        buyerName: "Alice",
        totalAmount: 120,
        status: "pending",
      };

      const state1 = orderReducer(initialOrderState, addReceivedOrder(sellerOrder));
      expect(state1.receivedOrders.length).toBe(1);
      expect(state1.receivedOrders[0].productName).toBe("Artisan Bread");

      // Duplicate protection
      const state2 = orderReducer(state1, addReceivedOrder(sellerOrder));
      expect(state2.receivedOrders.length).toBe(1);
    });

    it("should update order status live across both buyer and seller lists without full refetch (Test C)", () => {
      const initialWithOrders = {
        ...initialOrderState,
        myOrders: [{ _id: "ord_303", productName: "Fresh Apples", status: "pending" }],
        receivedOrders: [{ _id: "ord_303", productName: "Fresh Apples", status: "pending" }],
      };

      const nextState = orderReducer(
        initialWithOrders,
        updateOrderStatusInState({ orderId: "ord_303", status: "confirmed" })
      );

      expect(nextState.myOrders[0].status).toBe("confirmed");
      expect(nextState.receivedOrders[0].status).toBe("confirmed");
    });
  });

  describe("Notification Synchronization & Deduplication (Tests D & E)", () => {
    const initialNotifState = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
    };

    it("should add new real-time notification and increment unread count", () => {
      const notif = {
        _id: "notif_1",
        title: "Order Status Updated",
        message: 'Your order for "Fresh Apples" has been Confirmed!',
        type: "order",
        entityType: "order",
        entityId: "ord_303",
        link: "/orders?orderId=ord_303",
        isRead: false,
      };

      const state1 = notificationReducer(initialNotifState, addNotification(notif));
      expect(state1.notifications.length).toBe(1);
      expect(state1.unreadCount).toBe(1);
      expect(state1.notifications[0].link).toBe("/orders?orderId=ord_303");

      // Idempotency: Reconnect/duplicate emit should not duplicate notification or inflate unread count
      const state2 = notificationReducer(state1, addNotification(notif));
      expect(state2.notifications.length).toBe(1);
      expect(state2.unreadCount).toBe(1);
    });

    it("should mark single notification as read and decrement unread count correctly", () => {
      const stateWithNotif = {
        ...initialNotifState,
        notifications: [
          { _id: "notif_1", isRead: false },
          { _id: "notif_2", isRead: false },
        ],
        unreadCount: 2,
      };

      const state1 = notificationReducer(stateWithNotif, markSingleAsRead("notif_1"));
      expect(state1.notifications.find((n) => n._id === "notif_1").isRead).toBe(true);
      expect(state1.unreadCount).toBe(1);

      // Calling markSingleAsRead on already read notification should not decrement below 0
      const state2 = notificationReducer(state1, markSingleAsRead("notif_1"));
      expect(state2.unreadCount).toBe(1);
    });

    it("should mark all notifications as read", () => {
      const stateWithNotifs = {
        ...initialNotifState,
        notifications: [
          { _id: "n1", isRead: false },
          { _id: "n2", isRead: false },
        ],
        unreadCount: 2,
      };

      const nextState = notificationReducer(stateWithNotifs, markAllAsReadState());
      expect(nextState.unreadCount).toBe(0);
      expect(nextState.notifications.every((n) => n.isRead)).toBe(true);
    });
  });

  describe("Real-time Offers & Expiry Synchronization (Test F)", () => {
    const initialOfferState = {
      offers: [],
      myOffers: [],
      currentOffer: null,
      loading: false,
      error: null,
    };

    it("should remove deleted or expired offer immediately from active lists", () => {
      const stateWithOffers = {
        ...initialOfferState,
        offers: [
          { _id: "off_1", title: "50% Off Bakery", discountPercentage: 50 },
          { _id: "off_2", title: "30% Off Dairy", discountPercentage: 30 },
        ],
        myOffers: [{ _id: "off_1", title: "50% Off Bakery", discountPercentage: 50 }],
      };

      const nextState = offerReducer(stateWithOffers, removeOffer("off_1"));
      expect(nextState.offers.length).toBe(1);
      expect(nextState.offers[0]._id).toBe("off_2");
      expect(nextState.myOffers.length).toBe(0);
    });

    it("should add newly broadcast offer without duplicates", () => {
      const newOffer = { _id: "off_3", title: "Flash Weekend Produce", discountPercentage: 40 };
      const state1 = offerReducer(initialOfferState, addOffer(newOffer));
      expect(state1.offers.length).toBe(1);

      const state2 = offerReducer(state1, addOffer(newOffer));
      expect(state2.offers.length).toBe(1);
    });
  });
});
