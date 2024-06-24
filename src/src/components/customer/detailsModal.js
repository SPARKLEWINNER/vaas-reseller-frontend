import React, { useEffect, useState } from 'react';
import Circle from 'react-circle';
import { Modal, Box, Typography, Button, Card, CardMedia, CardContent, useMediaQuery, useTheme } from '@mui/material';

const DetailsModal = ({ open, handleClose, selectedRow }) => {
  const [percentage, setPercentage] = useState(0);

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.up('xs')); 
  // const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  // const isMd = useMediaQuery(theme.breakpoints.up('md'));
  // console.log('SelectedRow Data in DetailsModal:', selectedRow);

  // const modalContainerStyles = {
  //   ...(isXs && {
  //     marginLeft: '20px',
  //     marginRight: '20px',
  //   }),
  // };

  // Function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${formattedDate} ${formattedTime}`;
  };

  useEffect(() => {
    if (selectedRow) {
      if (selectedRow.rateAverageAmount > 0) {
        setPercentage(selectedRow.rateAverageAmount);
      } else {
        setPercentage(0);
      }
    }
  });

  const options = {
    size: 150, // Size of the circle
    lineWidth: 15, // Thickness of the circle
    progress: percentage, // Percentage of completion
    bgColor: '#f0f0f0', // Background color
    progressColor: 'rgb(116 84 235)',
    textColor: 'rgb(116 84 235)',
  };
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ display: 'flex' }}>
        {selectedRow && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'white',
              boxShadow: 24,
              p: 3,
              outline: 'none',
              minWidth: 400,
              borderRadius: 4,
            }}
          >
            <Box sx={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '200px', display: 'flex', flexDirection: 'column' }}>
                <img
                  src={selectedRow.profilePicture}
                  alt="customer profile"
                  width="150"
                  height="auto"
                  style={{ alignSelf: 'center', borderRadius: '10px' }}
                />
                <Typography variant="h6" gutterBottom style={{ alignSelf: 'center' }}>
                  {selectedRow.fullName}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {selectedRow.address}
                </Typography>
                <div>
                  <Typography variant="body2" gutterBottom>
                    Average No. of Transactions
                  </Typography>
                  <Typography>{selectedRow.averageOfTransaction}</Typography>
                </div>
              </div>
              <div className="percentage-display">
                <Card>
                  <CardMedia
                    style={{
                      display: 'flex',
                      justifyContent: 'center', // Center horizontally
                      alignItems: 'center', // Center vertically
                      height: '200px', // Set a specific height for CardMedia
                    }}
                  >
                    <Circle
                      progress={options.progress}
                      size={options.size}
                      lineWidth={options.lineWidth}
                      containerClassName={'circle-container'}
                      bgColor={options.bgColor}
                      progressColor={options.progressColor}
                      textColor={options.textColor}
                    />
                  </CardMedia>
                  <CardContent>
                    <Typography gutterBottom variant="subtitle1" component="div">
                      Average Purchase Amount
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRow.averageAmount > 0 ? selectedRow.averageAmount : 0}
                    </Typography>
                  </CardContent>
                </Card>
              </div>
            </Box>
            <Box sx={{ marginTop: '50px' }}>
              <div
                style={{
                  backgroundColor: 'rgb(222 217 248)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography> Purchase history </Typography>
              </div>
              <div style={{ width: '100%', overflow: 'auto' }}>
                <div
                  style={{
                    backgroundColor: 'rgb(237 239 242)',
                    borderRadius: '10px',
                    padding: '10px',
                    marginTop: '10px',
                  }}
                >
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '5px' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '5px' }}>Amount</th>
                        <th style={{ textAlign: 'right', padding: '5px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRow.purchases.length > 0 ? (
                        selectedRow.purchases.map((purchase) => (
                          <tr key={purchase._id}>
                            <td style={{ textAlign: 'left', padding: '5px' }}>
                              <Typography>{purchase.productName}</Typography>
                            </td>
                            <td style={{ textAlign: 'center', padding: '5px' }}>
                              <Typography>{purchase.amount}</Typography>
                            </td>
                            <td style={{ textAlign: 'right', padding: '5px' }}>
                              <Typography>
                                {formatDate(purchase.date)}
                                <br />({purchase.status})
                              </Typography>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: '50px',
                              }}
                            >
                              <Typography> No purchase data yet </Typography>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Box>
            {/* <Typography variant="body1">{selectedRow.description}</Typography> */}
            <Button variant="outlined" onClick={handleClose} sx={{ mt: 2 }}>
              Close
            </Button>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default DetailsModal;
