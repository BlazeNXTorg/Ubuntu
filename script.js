document.getElementById('coffeeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const status = document.getElementById('formStatus');

    if (name && email && message) {
        status.textContent = `Thank you, ${name}! Your message has been sent successfully.`;
        status.style.color = '#C88A58';
        this.reset();
    } else {
        status.textContent = 'Please fill out all fields before submitting.';
        status.style.color = '#d9534f';
    }
});
