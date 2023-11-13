
const express = require("express");
const router = express.Router();
const {
    createUser,
    loginUserCtrl,
    getallUser,
    deleteaUser,
    updatedUser,
    handleRefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    loginAdmin,
    saveAddress,
    userCart,
    getUserCart,
    updateProductQuantity,
    emptyCart,
    removeProductFromCart,
    createOrder,
    getOrders,
    updateOrderStatus,
    getAllOrders,
} = require("../controller/userCtrl");

const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {
    braintreeToken,
    braintreePayment
} = require("../controller/paymentCtrl");





router.post("/register", createUser);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/forgot-password-token", forgotPasswordToken);
router.post("/cart", authMiddleware, userCart);
router.post("/cart/cash-order", authMiddleware, createOrder);
router.post("/getorderbyuser/:id", authMiddleware, isAdmin, getAllOrders);

router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/all-users", getallUser);
router.get("/cart", authMiddleware, getUserCart);
router.get("/getmyorders", authMiddleware, getOrders);

router.delete("/emptycart", authMiddleware, emptyCart);
router.delete(
    "/delete-cart-product/:cartItemId",
    authMiddleware,
    removeProductFromCart
);
router.delete("/:id", deleteaUser);

router.put("/password", authMiddleware, updatePassword);
router.put("/reset-password/:token", resetPassword);
router.put("/save-address", authMiddleware, saveAddress)
router.put("/update-user", authMiddleware, updatedUser);
;
router.put(
    "/update-quantity/:cartItemId/:quantity",
    authMiddleware,
    updateProductQuantity
);
router.put("/edit-user", authMiddleware, updatedUser);




//payments routes
//token
router.get("/braintree/token", braintreeToken);
//payments
router.post("/braintree/payment", braintreePayment);


module.exports = router;




