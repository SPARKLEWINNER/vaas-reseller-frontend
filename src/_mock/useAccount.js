// ----------------------------------------------------------------------

import { useState, useEffect } from 'react';

function useAccount() {
  const [account, setAccount] = useState({
    displayName: 'Guest',
    email: 'guest@email.com',
    photoURL: '/assets/images/avatars/avatar_default.jpg',
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    if (user) {
      const updatedAccount = {
        displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        email: "Dealer",
        photoURL: '/assets/images/avatars/avatar_default.jpg',
      };
      setAccount(updatedAccount);
    }
  }, []);

  return account;
}

export default useAccount;