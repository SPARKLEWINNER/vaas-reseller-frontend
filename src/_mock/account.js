// ----------------------------------------------------------------------

async function fetchUserData(id) {
  const response = await fetch(`/api/user/${id}`, {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
  });
  const data = await response.json();
  return data;
}

const user = JSON.parse(localStorage.getItem('user'));
const role = localStorage.getItem('role');

const account = {
  displayName: user ? `${user.firstName} ${user.lastName}` : 'Guest',
  designation: user ? user.designation : 'N/A',
  email: user ? user.email : 'guest@email.com',
  photoURL: '/assets/images/avatars/avatar_default.jpg',
};

console.log("Email from localStorage:", user ? user.email : 'N/A');
console.log("First Name from localStorage:", user ? user.firstName : 'N/A');
console.log("Last Name from localStorage:", user ? user.lastName : 'N/A');
console.log("Role from localStorage:", role);

export default account;