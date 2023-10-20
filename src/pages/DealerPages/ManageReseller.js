import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Button,
  Tabs,
  Tab,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Card,
  CardContent,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Autocomplete,
  Menu,
  MenuItem,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import ValidatedManageReseller from '../../components/validation/ValidatedManageReseller';
import { validateName, validateEmail, validateMobileNumber } from '../../components/validation/validationUtils';
import { countryCodes } from '../../components/country/countryNumCodes';
import { countries } from '../../components/country/CountriesList';
import { mobileNumberLengths } from '../../components/country/countryNumLength';
import UserDataFetch from '../../components/user-account/UserDataFetch';

const StatusLabel = ({ status }) => {
  const colorMap = {
    Active: {
      text: 'green',
      background: '#e8f5e9',
    },
    Disabled: {
      text: 'darkorange',
      background: '#fff8e1',
    },
    Deactivated: {
      text: 'red',
      background: '#ffebee',
    },
  };

  const colors = colorMap[status];

  return (
    <Box
      sx={{
        display: 'inline-block',
        backgroundColor: colors.background,
        borderRadius: '8px',
        padding: '2px 8px',
        color: colors.text,
      }}
    >
      {status}
    </Box>
  );
};

const ManageReseller = () => {
  const userId = JSON.parse(localStorage.getItem('user'))._id;
  const userData = UserDataFetch(userId);
  const [open, setOpen] = useState(false);
  const initialFormState = {
    email: '',
    firstName: '',
    lastName: '',
    country: userData ? userData.country : '',
    mobileNumber: '',
    companyName: '',
  };
  const [formState, setFormState] = useState(initialFormState);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeCount, setActiveCount] = useState(0);
  const [disabledCount, setDisabledCount] = useState(0);
  const [deactivatedCount, setDeactivatedCount] = useState(0);
  const [currentTab, setCurrentTab] = useState('All');
  const [anchorEl, setAnchorEl] = useState(null);
  const [editingResellerId, setEditingResellerId] = useState(null);
  const tabsRef = useRef(null);
  const [showCredentialsPopup, setShowCredentialsPopup] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');

  const handleStatusClick = (event, resellerId) => {
    setAnchorEl(event.currentTarget);
    setEditingResellerId(resellerId);
  };

  const handleCloseStatusMenu = () => {
    setAnchorEl(null);
    setEditingResellerId(null);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/resellers/${editingResellerId}`, {
        status: newStatus,
      });
      const updatedResellers = await fetchResellersForUser(userId);
      setResellers(updatedResellers);
    } catch (error) {
      console.error('Error updating reseller status:', error);
    }
    handleCloseStatusMenu();
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setShowCredentialsPopup(false);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setTouchedFields((prevState) => ({
      ...prevState,
      [name]: true,
    }));

    validateField(name, value);
  };

  const [touchedFields, setTouchedFields] = useState({
    email: false,
    firstName: false,
    lastName: false,
    country: false,
    mobileNumber: false,
    companyName: false,
  });

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouchedFields((prevState) => ({
      ...prevState,
      [name]: true,
    }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'email': {
        if (value === '' || !validateEmail(value)) {
          error = value === '' ? 'Email is required' : 'Invalid Email';
        }
        break;
      }
      case 'firstName': {
        if (value === '' || !validateName(value)) {
          error = value === '' ? 'First Name is required' : 'Invalid First Name';
        }
        break;
      }
      case 'lastName': {
        if (value === '' || !validateName(value)) {
          error = value === '' ? 'Last Name is required' : 'Invalid Last Name';
        }
        break;
      }
      case 'country': {
        if (value === '') {
          error = 'Country is required';
        }
        break;
      }
      case 'mobileNumber': {
        const mobileValidationError = validateMobileNumber(formState.country, value, countryCodes, mobileNumberLengths);
        if (value === '' || mobileValidationError) {
          error = value === '' ? 'Mobile Number is required' : mobileValidationError;
        }
        break;
      }
      case 'companyName': {
        if (value === '') {
          error = 'Company Name is required';
        }
        break;
      }
      default:
        break;
    }
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const validateForm = () => {
    return Object.keys(validationErrors).every((key) => !validationErrors[key]);
  };

  const handleAddReseller = async () => {
    setTouchedFields({
      email: true,
      firstName: true,
      lastName: true,
      country: true,
      mobileNumber: true,
      companyName: true,
    });

    const tempValidationErrors = {};

    Object.keys(formState).forEach((field) => {
      const error = getValidationError(field, formState[field]);
      if (error) {
        tempValidationErrors[field] = error;
      }
    });

    setValidationErrors(tempValidationErrors);

    if (Object.keys(tempValidationErrors).length === 0) {
      try {
        const prefix = countryCodes[formState.country];

        const requestData = {
          ...formState,
          mobileNumber: prefix + formState.mobileNumber,
        };

        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/resellers`, requestData);
        console.log('Reseller added successfully:', res.data);
        setFormState(initialFormState);
        setGeneratedPassword(res.data.password);
        setShowCredentialsPopup(true);
        setOpen(false);
      } catch (error) {
        console.error('Error adding reseller:', error);
      }
    }
  };

  const getValidationError = (name, value) => {
    switch (name) {
      case 'email': {
        return value === '' ? 'Email is required' : validateEmail(value) ? '' : 'Invalid Email';
      }
      case 'firstName': {
        return value === '' ? 'First Name is required' : validateName(value) ? '' : 'Invalid First Name';
      }
      case 'lastName': {
        return value === '' ? 'Last Name is required' : validateName(value) ? '' : 'Invalid Last Name';
      }
      case 'country': {
        return value === '' ? 'Country is required' : '';
      }
      case 'mobileNumber': {
        const mobileValidationError = validateMobileNumber(formState.country, value, countryCodes, mobileNumberLengths);
        return value === '' ? 'Mobile Number is required' : mobileValidationError;
      }
      case 'companyName': {
        return value === '' ? 'Company Name is required' : '';
      }
      default:
        return '';
    }
  };

  const fetchResellersForUser = async (userId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/resellers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resellers:', error);
      throw error;
    }
  };

  const [resellers, setResellers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedResellers = await fetchResellersForUser(userId);
        setResellers(fetchedResellers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    const activeResellers = resellers.filter((r) => r.status === 'Active');
    const disabledResellers = resellers.filter((r) => r.status === 'Disabled');
    const deactivatedResellers = resellers.filter((r) => r.status === 'Deactivated');

    setActiveCount(activeResellers.length);
    setDisabledCount(disabledResellers.length);
    setDeactivatedCount(deactivatedResellers.length);
  }, [resellers]);

  useEffect(() => {
    if (userData && userData.country) {
      setFormState((prevState) => ({ ...prevState, country: userData.country }));
    }
  }, [userData]);

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="20px">
            <Typography variant="h5">My Resellers</Typography>
            <Button variant="contained" style={{ backgroundColor: '#000', color: '#fff' }} onClick={handleOpen}>
              + Add Reseller
            </Button>
          </Box>

          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
            <div ref={tabsRef} style={{ flexGrow: 1 }}>
              <Tabs value={currentTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                <Tab
                  label={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      All
                      <span
                        style={{
                          color: 'white',
                          backgroundColor: 'black',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          marginLeft: '5px',
                        }}
                      >
                        {resellers.length}
                      </span>
                    </div>
                  }
                  value="All"
                />
                <Tab
                  label={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Active
                      <span
                        style={{
                          color: 'green',
                          backgroundColor: '#e8f5e9',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          marginLeft: '5px',
                        }}
                      >
                        {activeCount}
                      </span>
                    </div>
                  }
                  value="Active"
                />
                <Tab
                  label={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Disabled
                      <span
                        style={{
                          color: 'darkorange',
                          backgroundColor: '#fff8e1',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          marginLeft: '5px',
                        }}
                      >
                        {disabledCount}
                      </span>
                    </div>
                  }
                  value="Disabled"
                />
                <Tab
                  label={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Deactivated
                      <span
                        style={{
                          color: 'red',
                          backgroundColor: '#ffebee',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          marginLeft: '5px',
                        }}
                      >
                        {deactivatedCount}
                      </span>
                    </div>
                  }
                  value="Deactivated"
                />
              </Tabs>
            </div>
          </div>

          <TextField
            label={value ? 'Search User' : null}
            placeholder="Search User"
            variant="outlined"
            fullWidth
            style={{ margin: '20px 0' }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <div style={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <IconButton size="small">
                      <MoreVertIcon fontSize="inherit" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resellers
                  .filter((reseller) => currentTab === 'All' || reseller.status === currentTab)
                  .map((reseller) => (
                    <TableRow key={reseller._id}>
                      <TableCell padding="checkbox">
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div>
                          {reseller.firstName} {reseller.lastName}
                        </div>
                        <Typography variant="body2" color="textSecondary">
                          {reseller.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{reseller.mobileNumber}</TableCell>
                      <TableCell>{reseller.companyName}</TableCell>
                      <TableCell>
                        <StatusLabel status={reseller.status} />
                      </TableCell>
                      <TableCell style={{ width: '50px' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          <IconButton
                            size="small"
                            style={{ marginRight: '8px' }}
                            onClick={(e) => handleStatusClick(e, reseller._id)}
                          >
                            <EditIcon fontSize="inherit" />
                          </IconButton>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="inherit" />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseStatusMenu}>
        <MenuItem onClick={() => handleStatusChange('Active')}>Active</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Disabled')}>Disabled</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Deactivated')}>Deactivated</MenuItem>
      </Menu>

      {/* Modal/Dialog for adding a new reseller */}
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle
          id="form-dialog-title"
          sx={{
            backgroundColor: '#7A52F4',
            color: 'white',
            padding: '16px',
            textAlign: 'center',
            fontSize: '35px !important',
          }}
        >
          Add Reseller
        </DialogTitle>
        <DialogContent>
          <ValidatedManageReseller
            validationFunction={validateEmail}
            label="Email"
            name="email"
            value={formState.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            fullWidth
            sx={{ mt: 2 }}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
          />
          <ValidatedManageReseller
            validationFunction={validateName}
            label="First Name"
            name="firstName"
            value={formState.firstName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            fullWidth
            sx={{ mt: 2 }}
            error={!!validationErrors.firstName}
            helperText={validationErrors.firstName}
          />
          <ValidatedManageReseller
            validationFunction={validateName}
            label="Last Name"
            name="lastName"
            value={formState.lastName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            error={!!validationErrors.lastName}
            helperText={validationErrors.lastName}
          />
          <Autocomplete
            fullWidth
            options={countries}
            getOptionLabel={(option) => option}
            value={formState.country}
            onChange={(event, newValue) => {
              setFormState((prevState) => ({ ...prevState, country: newValue }));
            }}
            onBlur={handleBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Country"
                variant="outlined"
                sx={{ mb: 2 }}
                error={!!validationErrors.country}
                helperText={validationErrors.country}
              />
            )}
          />
          <ValidatedManageReseller
            validationFunction={(value) =>
              validateMobileNumber(formState.country, value, countryCodes, mobileNumberLengths) === ''
            }
            fullWidth
            label="Mobile Number"
            variant="outlined"
            name="mobileNumber"
            value={formState.mobileNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {formState.country && countryCodes[formState.country] ? `${countryCodes[formState.country]} |` : ''}
                </InputAdornment>
              ),
            }}
            InputLabelProps={{
              shrink: !!formState.mobileNumber || !!formState.country,
            }}
            error={!!validationErrors.mobileNumber}
            helperText={validationErrors.mobileNumber}
            disabled={!formState.country}
          />
          <TextField
            fullWidth
            variant="outlined"
            label="Company Name (Optional)"
            name="companyName"
            value={formState.companyName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            sx={{ mb: 0.4 }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Button
              variant="contained"
              style={{
                width: '140px',
                height: '40px',
                borderRadius: '22px',
                fontSize: '14px',
                backgroundColor: '#7A52F4',
                color: '#fff',
              }}
              onClick={handleAddReseller}
            >
              Submit
            </Button>

            <Button onClick={handleClose} color="primary" sx={{ mb: 2 }}>
              Cancel
            </Button>
          </div>
        </DialogActions>
      </Dialog>
      <Dialog open={showCredentialsPopup} onClose={() => setShowCredentialsPopup(false)}>
        <DialogTitle>Reseller Successfully Created</DialogTitle>
        <DialogContent>
          <Typography>Please save the following credentials for your reseller to use:</Typography>
          <Box mt={2}>
            <Typography>
              <strong>Email:</strong> {formState.email}
            </Typography>
            <Typography>
              <strong>Password:</strong> {generatedPassword}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              // Placeholder for change password functionality
              console.log('Change Password Clicked');
              setShowCredentialsPopup(false);
            }}
            color="primary"
          >
            Change Password
          </Button>
          <Button onClick={() => setShowCredentialsPopup(false)} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ManageReseller;
