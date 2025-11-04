const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

const format = (amount) => currencyFormatter.format(amount);

module.exports = { format };