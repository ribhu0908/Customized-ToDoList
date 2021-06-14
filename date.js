
exports.getDate= function() {

    const today = new Date();
    const options = {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
}

