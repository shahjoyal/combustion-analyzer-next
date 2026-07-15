
const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!email || !password) {
        message.style.color = 'red';
        message.textContent = 'Please fill in both fields.';
        return;
    }

    try {
      const res = await fetch('./auth/login', {
        method: 'POST',
        credentials: 'include', // important to store session cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        message.style.color = 'red';
        message.textContent = data.error || 'Login failed';
        return;
      }
      message.style.color = 'green';
      message.textContent = 'Login successful! Redirecting...';
       localStorage.setItem('isLoggedIn', 'true');
      // Redirect to your main app page (adjust path as necessary)
      setTimeout(()=> window.location.href = './slagging_coal_page.html', 400);
    } catch (err) {
      console.error(err);
      message.style.color = 'red';
      message.textContent = 'Network error';
    }
});
