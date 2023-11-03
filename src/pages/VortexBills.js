/* eslint-disable react/jsx-no-bind */
/* eslint-disable no-plusplus */
import {
  Backdrop,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  List,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
  InputBase,
  AlertTitle,
  Alert,
} from "@mui/material"
import { Form, Formik } from "formik"
import { Box } from "@mui/system"
// import { navigate } from "gatsby" //commented out for testing now turn all navigate to console.log
import React, { useState, useEffect, useReducer, useContext } from "react"
import * as yup from "yup"
import SecureLS from "secure-ls"

import { BillerIcon } from "../Vortex/components/VortexBillerCategory"
import VortexBillerCard from "../Vortex/components/VortexBillerCard"

import {
  createBillsPaymentTransaction,
  getBillerById,
  getBillers,
} from "../api/public/vortex/billspayment_service"
import { getVortexTokenBase, signIn } from "../api/public/vortex/token_service"


import CenteredProgress from "../Vortex/components/centeredProgress"
import VortexFormToolbar from "../Vortex/components/VortexFormToolbar"
import VortexError from "../Vortex/components/VortexError"
import jsonFieldsToArray from "../Vortex/helpers/jsonfieldstoarray"

import VortexCustomTextField from "../Vortex/components/VortexCustomTextField"
import {
  saveVortexBillsPaymentTransaction,
  updateVortexByRefId,
} from "../api/public/vortex/transaction_db"
import VortexBillerAccordionList from "../Vortex/components/VortexBillerAccordionList"

// import {
//   LoginState,
//   PlatformVariables,
//   StoreStatus,
//   UserStatus,
// } from "../../globalstates"

// import LoginPage from "../../LoginPage"
import { primaryVortexTheme } from "../Vortex/config/theme"
import VortexBillerLogoComponent from "../Vortex/components/VortexBillerLogoComponent"
import VortexBillerListItem from "../Vortex/components/VortexBillerListItem"
import VortexBottomGradient from "../Vortex/components/VortexBottomGradient"

// import BottomNavigator from "../../Homemade/BottomNavigator"
// import useLoggedUser from "../../../custom-hooks/useLoggedUser" // remove all user related

import getBillerAbbreviation from "../Vortex/functions/getBillerAbbreviation"
import trimObjValues from "../Vortex/helpers/trimobjectvalues"
import BlockPrompt from "../Vortex/Prompts/BlockPrompt"
import StoreBlockPrompt from "../Vortex/Prompts/StoreBlockPrompt"
// import { getStoreEnvById } from "../../../api/public/store-env" remove all store related
import ServiceDisabledPrompt from "../Vortex/Prompts/ServiceDisabledPrompt"
import PhoneTextfield from '../Vortex/Textfields/PhoneTextfield'

const LoginPage = () => (
    <Box>
      <div> Login Page</div>
    </Box>
  )

const BottomNavigator = () => (
    <Box>
      <div> Bottom Navigator</div>
    </Box>
  )

const VortexBillsPaymentPage = () => {
  const forApi = signIn("ilagandarlomiguel@gmail.com", "GrindGr@titud3")
  const ls = new SecureLS({ encodingType: "aes" })

  const [error, setErrorData] = useState({ isError: false, message: "" })

  const [transactionDocId, setTransactionDocId] = useState(null)

  const [transactionReferenceId, setTransactionReferenceId] = useState(null)

  const [platformVariables, setPlatformVariables] = useState({})

  const [userStatus, setUserStatus] = useState(null)

  const [storeStatus, setstoreStatus] = useState(null)

  const [activeStep, setActiveStep] = useState(0)

  const [data, setData] = useState([])

  const [renderData, setRenderData] = useState([])

  const [categories, setcategories] = useState([])

  const [selectedBiller, setSelectedBiller] = useState(null)

  const [billDetails, setBillDetails] = useState(null)

  const [inputFormData, setinputFormData] = useState({})

  const [transactionDetails, setTransactionDetails] = useState()

  const [currentSelectedCategory, setCurrentSelectedCategory] = useState(null)

  const [isLoggin, setisLoggin] = useState(null)

  // Getting store env and user status
  // const { getUser } = useLoggedUser()

  // useEffect(async () => {

  //   let store = ls.get("store")

  //   let storeEnvId = store?.storeEnv?._id || store?.storeEnv

  //   let x = await getStoreEnvById({ storeEnvId: storeEnvId })

  //   setPlatformVariables(x)

  // }, [])

  const getServiceFee = ({ amount, currency }) => {
    // let paypalPercentage = amount * 0.0355
    // let foreignFee = amount * 0.01
    // let paypalFee = Math.round(paypalPercentage) + Math.round(foreignFee)
    const amountInDirham = parseFloat(
      amount / platformVariables.billsCurrencyToPeso
    )
    let convenienceFee = parseFloat(platformVariables.billsConvenienceFee) // convenience fee only for bills/vouchers  -platformVariables.convenienceFeeInDirham
    let grandTotalFee = parseFloat(amountInDirham) + parseFloat(convenienceFee)

    convenienceFee = parseFloat(convenienceFee).toFixed(2)
    grandTotalFee = parseFloat(grandTotalFee).toFixed(2)

    return { convenienceFee, grandTotalFee }
  }

  const [isLoading, setisLoading] = useState(false)

  function stepBack() {
    setActiveStep(activeStep - 1)
  }

  function stepForward() {
    setActiveStep(activeStep + 1)
  }

  async function handleVortexRequestGCash({ paymentData }) {
    try {
      setisLoading(true)

      // save transaction only as for manual Gcash
      setTransactionDetails(paymentData)

      const saveTransaction = await updateVortexByRefId({
        refId: transactionReferenceId,
        data: {
          paymentId: "Awaiting for GCash Payment",
          paymentMethod: "GCash",
          totalAmount: paymentData.grandTotalFee,
        },
      })

      // navigate(
      //   `/vortextransactions/billspayment/${saveTransaction.referenceNumber}`,
      //   { state: saveTransaction }
      // )
      console.log('saveTransaction', saveTransaction)
      console.log("go to /vortextransactions/billspayment/$ { saveTransaction.referenceNumber}")

      setisLoading(false)
    } catch (error) {
      setErrorData({
        isError: true,
        message: error,
      })
      throw Error(error)
    }
  }

  async function handleVortexRequest({ docId, paymentData }) {
    try {
      const vortexTokenResponse = await getVortexTokenBase()

      if (vortexTokenResponse.status === 200) {
        const vortextTokenResult = await vortexTokenResponse.json()

        const vortexBillPaymentTransactionResponse =
          await createBillsPaymentTransaction(
            vortextTokenResult.access_token,
            docId,
            process.env.GATSBY_APP_VORTEX_CLIENTREQID,
            selectedBiller.id,
            billDetails,
            paymentData?.data?.orderID,
            paymentData?.details?.purchase_units[0]?.amount?.value
          )

        const vortexBillPaymentTransactionResult =
          await vortexBillPaymentTransactionResponse.json()

        if (vortexBillPaymentTransactionResponse.status === 200) {
          const refNo = vortexBillPaymentTransactionResult?.referenceNumber

          // Check if the response is error
          if (typeof refNo === "undefined") {
            setErrorData({
              isError: true,
              message: `Error code: ${vortexBillPaymentTransactionResult.message}`,
            })

            return
          }

          if (vortexBillPaymentTransactionResult.transactionData)
            setTransactionDetails(vortexBillPaymentTransactionResult)

          // navigate(
          //   `/vortextransactions/billspayment/${vortexBillPaymentTransactionResult.referenceNumber}`
          // )
          console.log('vortexBillPaymentTransactionResult', vortexBillPaymentTransactionResult)
          console.log("go to /vortextransactions/billspayment/$ { vortexBillPaymentTransactionResult.referenceNumber}")
        } else {
          setErrorData({
            isError: true,
            message: "There is an error on the request to vortex",
          })
        }
      } else {
        setErrorData({
          isError: true,
          message: "There is an error on the request to vortex",
        })
      }
    } catch (error) {
      setErrorData({
        isError: true,
        message: `${error}`,
      })
    }
  }

  async function handleVortexCashRequest({ docId, total }) {
    try {
      const vortexTokenResponse = await getVortexTokenBase()

      if (vortexTokenResponse.status === 200) {
        const vortextTokenResult = await vortexTokenResponse.json()

        const vortexBillPaymentTransactionResponse =
          await createBillsPaymentTransaction({
            access_token: vortextTokenResult.access_token,
            docId,
            clientRequestId: process.env.GATSBY_APP_VORTEX_CLIENTREQID,
            billerId: selectedBiller.id,
            billDetails,
            paymentId: "Payment via Store",
            totalAmount: total,
            oneAedToPhp: platformVariables.billsCurrencyToPeso,
            convenienceFee: platformVariables.billsConvenienceFee,
            currencySymbol: platformVariables?.currencySymbol,
            currencyToPhp: platformVariables?.billsCurrencyToPeso,
            callbackUrl: ""
          })

        const vortexBillPaymentTransactionResult =
          await vortexBillPaymentTransactionResponse.json()

        if (vortexBillPaymentTransactionResponse.status === 200) {
          const refNo = vortexBillPaymentTransactionResult?.referenceNumber

          // Check if the response is error
          if (typeof refNo === "undefined") {
            setErrorData({
              isError: true,
              message: `Error code: ${vortexBillPaymentTransactionResult.message}`,
            })

            return
          }

          if (vortexBillPaymentTransactionResult.transactionData)
            setTransactionDetails(vortexBillPaymentTransactionResult)

          // navigate(
          //   `/vortextransactions/billspayment/${vortexBillPaymentTransactionResult.referenceNumber}`
          // )
          console.log('vortexBillPaymentTransactionResult', vortexBillPaymentTransactionResult)
          console.log("go to /vortextransactions/billspayment/$ { vortexBillPaymentTransactionResult.referenceNumber}")
        } else {
          setErrorData({
            isError: true,
            message: "There is an error on the request to vortex",
          })
        }
      } else {
        setErrorData({
          isError: true,
          message: "There is an error on the request to vortex",
        })
      }
    } catch (error) {
      setErrorData({
        isError: true,
        message: `${error}`,
      })
    }
  }

  // This will load all billers when component is rendered
  useEffect(async () => {
    setisLoading(true)
    const vortexTokenResponse = await getVortexTokenBase()

    if (vortexTokenResponse.status === 200) {
      const vortextTokenResult = await vortexTokenResponse.json()

      getBillers(vortextTokenResult.access_token, 1, 1000).then((response) => {
        
        setisLoading(false)
        if (response.status === 200) {
          response.json().then((result) => {
            console.log(result) // currently 119 billers
            setData(result)
          })
        } else {
          setisLoading(false)
          response.json().then((result) => {
            setErrorData({
              isError: true,
              message: result.error.message,
            })
          })
        }
      })
    } else {
      setisLoading(false)
      vortexTokenResponse.json().then((result) => {
        setErrorData({
          isError: true,
          message: result.error.message,
        })
      })
    }
  }, [])

  // This will compile all biller categories when data is received
  useEffect(() => {
    const gatheredCategories = []
    if (data?.length > 0) {
      for (let index = 0; index < data?.length; index++) {
        if (!gatheredCategories.includes(data[index].category)) {
          gatheredCategories.push(data[index].category)
        }
      }
      setcategories(gatheredCategories)
    }
  }, [data])

  // This will display all compiled categories
  const BillsPaymentCategoriesPage = () => {
    const [_billers, _setBillers] = useState([])
    const [search, setSearch] = useState([])

    const [_currentSelectedCategory, _setCurrentSelectedCategory] = useReducer(
      filterBillerByCategories,
      ""
    )

    // This will filter all biller by categories
    function filterBillerByCategories(state, category) {
      const filteredBillers = []
      if (data?.length > 0) {
        for (let index = 0; index < data?.length; index++) {
          if (data[index]?.category === category) {
            filteredBillers.push(getBillerAbbreviation(data[index]))
          }
        }
        _setBillers(filteredBillers)
      }

      return category
    }

    function searchBillers(search) {
      if (search.trim().replaceAll(" ", "").length === 0) {
        setSearch([])
        return
      }

      const filteredBillers = []
      if (data?.length > 0) {
        for (let index = 0; index < data?.length; index++) {
          const billerName = data[index].name
            .toLowerCase()
            .replaceAll(" ", "")
          if (billerName.includes(search.toLowerCase()))
            filteredBillers.push(data[index])
        }
      }

      setSearch(filteredBillers)
    }

    return (
      <Box>
        <VortexFormToolbar
          title={"Bills"}
          onClickBack={() => {
            // navigate(-1)
            console.log(" navigate back")
            window.history.back()
          }}
        />
        <Toolbar />

        {!isLoading && (
          <>
            <VortexBillerSearch onInput={searchBillers} />
            {search.length === 0 ? (
              <>
                <VortexBillerAccordionList
                  categories={categories}
                  billers={_billers}
                  onSelectCategory={(category) => {
                    _setCurrentSelectedCategory(category)
                  }}
                  onSelectBiller={(biller) => {
                    setCurrentSelectedCategory(_currentSelectedCategory)

                    setSelectedBiller(biller)
                    stepForward()
                  }}
                />
              </>
            ) : (
              <VortexBillerSearchResult
                billers={search}
                onBillerSelect={(biller) => {
                  setCurrentSelectedCategory(biller.category)
                  setSelectedBiller(biller)
                  stepForward()
                }}
              />
            )}
          </>
        )}
      </Box>
    )
  }

  const VortexBillerSearchResult = ({ billers, onBillerSelect }) => billers.map((biller) => (
        <VortexBillerListItem
          id={biller.id}
          title={biller.name}
          category={biller.category}
          onClick={() => {
            onBillerSelect(biller)
          }}
        />
      ))

  const VortexBillerSearch = ({ onInput }) => {
    const [input, setInput] = useState("")
    const delay = (function (callback, ms) {
      let timer = 0
      return function (callback, ms) {
        clearTimeout(timer)
        timer = setTimeout(callback, ms)
      }
    })()

    const searchAfterDelay = (e) => {
      setInput(e.target.value)
      delay(() => {
        // search here
        onInput(e.target.value)
      }, 1000)
    }

    return (
      <div
        style={{
          margin: "1em",
        }}
      >
        <div className="heading-search-container">
          <div className="heading-search-shape" style={{display: "flex"}}>
            <InputBase
              disabled={false}
              style={{
                width: "100%",
                fontFamily: "montserrat",
                fontSize: "1em",
                fontWeight: "500",
                color: "#6b6b6b",
                paddingLeft: "0.3em",
                zIndex: 999,
              }}
              placeholder="Search for products here"
              onInput={searchAfterDelay}
              value={input}
            />
            {input?.length > 0 && (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                style={{
                  color: "grey",
                  fontWeight: "bold",
                }}
                onClick={() => {
                  setInput("")
                  onInput("")
                }}
              >
                X
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // This will display billers by category
  const BillersListByCategory = () => {
    if (currentSelectedCategory === null) {
      return <div />
    }

    return (
      <Box>
        <VortexFormToolbar
          title={"Bills"}
          onClickBack={() => {
            stepBack()
          }}
        />
        <Toolbar />
        <List
          dense
          sx={{ width: "100%", bgcolor: "background.paper", marginLeft: "1em" }}
        >
          {renderData.map((v) => (
              <VortexBillerCard
                title={v.name}
                onClick={() => {
                  setSelectedBiller(v)
                  stepForward()
                }}
              />
            ))}
        </List>
      </Box>
    )
  }

  // This is the main layout for biller details
  const BillerDetails = () => {
    const [billerDetails, setbillerDetails] = useState(null)

    const [isLoadingBiller, setIsLoadingBiller] = useState(false)

    useEffect(async () => {
      setIsLoadingBiller(true)
      const vortexTokenResponse = await getVortexTokenBase()

      if (vortexTokenResponse.status === 200) {
        const vortextTokenResult = await vortexTokenResponse.json()
        getBillerById(vortextTokenResult.access_token, selectedBiller.id).then(
          (response) => {
            if (response.status === 200) {
              response.json().then((result) => {
                console.log(result)
                setbillerDetails(result)
                setIsLoadingBiller(false)
              })
            }
          }
        )
      } else {
        setIsLoadingBiller(false)
      }
    }, [])

    if (isLoadingBiller) {
      return <CenteredProgress />
    }

    return (
      <Box>
          <Box>
            <VortexFormToolbar
              title={"Bills"}
              onClickBack={() => {
                stepBack()
              }}
            />
            <Toolbar />
            <Box style={{ margin: "1em", paddingTop: "1em" }}>
              <Stack spacing={1} textAlign={"center"}>
                <Stack direction={"row"} justifyContent={"center"}>
                  <VortexBillerLogoComponent
                    id={billerDetails?.id}
                    billerName={billerDetails?.name}
                    altComponent={
                      <BillerIcon categoryName={billerDetails?.category} />
                    }
                  />
                </Stack>
                <Typography
                  color="gray"
                  style={{ fontSize: "1.5em", fontWeight: "bold" }}
                >
                  {billerDetails?.name.toUpperCase()}
                </Typography>
                <Alert severity="info" style={{display: "flex", alignSelf: "center"}}>
                  <AlertTitle>Please note</AlertTitle>
                  <Stack textAlign={"start"}>
                    <Typography fontSize={10}>
                      {" "}
                      1. Input the exact amount based on customer's provided
                      bill. (Ex. 8016.40 instead of 8,016.4)
                    </Typography>
                    <Typography fontSize={10}>
                      2. Bills, especially utility bills, should be processed on
                      or Before due date.
                    </Typography>
                    <Typography fontSize={10}>
                      3. Make sure to check previous SUCCESSFUL transactions to
                      avoid double transaction.
                    </Typography>
                  </Stack>
                </Alert>
                <BillerFormGenerator formFields={billerDetails?.form} />
              </Stack>
            </Box>
          </Box>
      </Box>
    )
  }

  // This will generate the form base on the response
  const BillerFormGenerator = ({ formFields = [] }) => {
    const [isFormLoading, setIsFormLoading] = useState(false)

    // for (let index = 0; index < formFields?.length; index++) {
    //   initValues[`${formFields[index]?.fieldRules[0].elementName}`] = ""
    // }

    const formSchema = yup.object({
      AmountDue: yup
        .number()
        .oneOf(
          [yup.ref("AmountPaid"), null],
          "AmountDue and Amount paid must match"
        ),
      AmountPaid: yup
        .number()
        .oneOf(
          [yup.ref("AmountDue"), null],
          "AmountDue and AmountPaid must match"
        ),
    })

    console.log(formFields)

    return (
      <Box>
        <Formik
          initialValues={inputFormData}
          onSubmit={async (data) => {
            try {
              console.log(data)
              setinputFormData(data)

              // setIsFormLoading(true)

              // todo: add minimum value for money validation - can't add it on html form as we are using strings

              if (Reflect.has(data, "billAmount"))
                data.billAmount = parseFloat(data.billAmount).toFixed(2)

              if (Reflect.has(data, "AmountPaid"))
                data.AmountPaid = parseFloat(data.AmountPaid).toFixed(2)

              if (Reflect.has(data, "amount"))
                data.amount = parseFloat(data.amount).toFixed(2)

              const { convenienceFee, grandTotalFee } = getServiceFee({
                amount: data?.billAmount || data?.AmountPaid || data?.amount,
                currency: platformVariables.currency,
              })

              // console.log("Grand total", platformVariables.billsCurrencyToPeso)

              const collectedBillDetails = trimObjValues(data)
              console.log("billDetails", collectedBillDetails)
              
              setBillDetails(collectedBillDetails)

              stepForward()

              // const reqInputPayload = {
              //   billerId: selectedBiller.id,
              //   billDetails: { ...collectedBillDetails },
              //   callbackUrl: "app.sparkles.com.ph",
              // }

              // const result = await saveVortexBillsPaymentTransaction({
              //   requestInputPayload: reqInputPayload,
              //   totalAmount: grandTotalFee,
              // })

              // setTransactionDocId(result._id)

              // setTransactionReferenceId(result.referenceNumber)

              // setIsFormLoading(false)

              // setBillDetails(collectedBillDetails)

              // stepForward()

              
            } catch (error) {
              setErrorData({
                isError: true,
                message: `${error}`,
              })
            }
          }}
          validationSchema={formSchema}
        >
          {({ handleChange, values }) => (
            <Form>
              <Stack spacing={2} margin={2}>
                {formFields.map((v) => {
                  // Date input
                  if (v?.fieldRules[0]?.inputType === "date") {
                    const date = new Date()
                    const today = `${date.getFullYear()}-${date
                      .getMonth()
                      .toString()
                      .padStart(2, 0)}-${date
                        .getDay()
                        .toString()
                        .padStart(2, 0)}`

                    return (
                      <TextField
                        name={v?.fieldRules[0]?.elementName}
                        helperText={v?.fieldName}
                        required={v?.fieldRules[0]?.requiredField}
                        type={v?.fieldRules[0]?.inputType}
                        disabled={
                          v?.fieldRules[0]?.state !== "enabled"
                        }
                        hidden={v?.fieldRules[0]?.hidden}
                        inputProps={{
                          maxLength: v?.fieldRules[0]?.maxFieldLength,
                          minLength: v?.fieldRules[0]?.minFieldLength,
                        }}
                        onChange={handleChange}
                      />
                    )
                  }

                  // Select or drop down input
                  if (v?.fieldRules[0]?.inputType === "select") {
                    const selectOptions =
                      v?.fieldRules[0]?.inputTypeOption.split(",")
                    return (
                      <FormControl>
                        <InputLabel id="demo-simple-select-helper-label">
                          {v?.fieldName}
                        </InputLabel>
                        <Select
                          name={v?.fieldRules[0]?.elementName}
                          label={v?.fieldName}
                          required={v?.fieldRules[0]?.requiredField}
                          type={v?.fieldRules[0]?.inputType}
                          disabled={
                            v?.fieldRules[0]?.state !== "enabled"
                          }
                          onChange={handleChange}
                        >
                          {selectOptions.map((option) => (
                            <MenuItem value={option.split(":")[0]}>
                              {option.split(":")[1]}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {v?.fieldRules[0]?.inputFormat}
                        </FormHelperText>
                      </FormControl>
                    )
                  }

                  if (v?.fieldRules[0]?.inputType === 'text' && v?.fieldRules[0]?.elementName === 'mobile_number') {
                    return <PhoneTextfield
                      countryCodeIndex={971}
                      name={v?.fieldRules[0]?.elementName}
                      label={v?.fieldName}
                      required={v?.fieldRules[0]?.requiredField}
                      type={v?.fieldRules[0]?.inputType}
                      disabled={
                        v?.fieldRules[0]?.state !== "enabled"
                      }
                      hidden={v?.fieldRules[0]?.hidden}
                      inputProps={{
                        datatype: v?.fieldRules[0]?.dataType,
                        maxLength: v?.fieldRules[0]?.maxFieldLength,
                        minLength: v?.fieldRules[0]?.minFieldLength,
                      }}
                      helperText={v?.fieldRules[0]?.inputFormat}
                    />
                  }

                  // Default text input
                  return (
                    <VortexCustomTextField
                      name={v?.fieldRules[0]?.elementName}
                      label={v?.fieldName}
                      required={v?.fieldRules[0]?.requiredField}
                      type={v?.fieldRules[0]?.inputType}
                      disabled={
                        v?.fieldRules[0]?.state !== "enabled"
                      }
                      hidden={v?.fieldRules[0]?.hidden}
                      inputProps={{
                        datatype: v?.fieldRules[0]?.dataType,
                        maxLength: v?.fieldRules[0]?.maxFieldLength,
                        minLength: v?.fieldRules[0]?.minFieldLength,
                      }}
                      helperText={v?.fieldRules[0]?.inputFormat}
                    />
                  )
                })}
                <Button
                  disabled={isFormLoading}
                  variant="contained"
                  type="submit"
                  sx={{
                    width: "100%",
                    marginTop: "1em",
                    borderRadius: "2em",
                    height: "3em",
                    color: "white !important",
                    background: "blue !important",
                  }}
                >
                  {isFormLoading ? "Please wait..." : "CONTINUE"}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>

        <Box sx={{ height: "10em" }} />
      </Box>
    )
  }

  const ReviewConfirmationForm = () => {
    const paymentMethodType = ls.get("paymentMethodType")
    const fields = jsonFieldsToArray(billDetails)
    // let [paymentDetails, setPaymentDetails] = useState({})

    // const { email, name, phone, address } = getUser()

    const { convenienceFee, grandTotalFee } = getServiceFee({
      amount:
        billDetails?.billAmount ||
        billDetails?.AmountPaid ||
        billDetails?.amount,
      currency: "PHP",
    })

    const [isLoadingPrivate, setIsLoadingPrivate] = useState(true) // true for render testing
    const [isPaymentMethodGCash, setisPaymentMethodGCash] = useState(false)
    const [expanded, setExpanded] = useState("panel1")

    const handleAccordionChange = (panel) => (event, isExpanded) => {
      console.log(panel, isExpanded)
      // setExpanded(isExpanded ? panel : false)
      if (panel === "panel1" && isExpanded === false) {
        setExpanded("panel2")
      } else if (panel === "panel1" && isExpanded) {
        setExpanded("panel1")
      } else if (panel === "panel2" && isExpanded === false) {
        setExpanded("panel1")
      } else if (panel === "panel2" && isExpanded) {
        setExpanded("panel2")
      }
    }

    return (
      <Box>
        
          <div style={{ zIndex: 0 }}>
            {/* {isLoading && <CenteredProgress />} */}
            {!isLoadingPrivate && (
              <>
                <VortexFormToolbar
                  title={"Bills payment"}
                  onClickBack={() => {
                    stepBack()
                  }}
                />
                <Toolbar />
                <Box style={{ margin: "2em 1em 1em 1em  " }}>
                  <Stack style={{ margin: "0.5em" }}>
                    <Typography
                      style={{
                        color: "#0060bf",
                        marginTop: "1em",
                      }}
                      fontWeight={"bold"}
                      fontSize={30}
                    >
                      Account Details
                    </Typography>
                    <Divider />
                  </Stack>
                  <Stack spacing={2} style={{ marginBottom: "1em" }}>
                    {/* <Stack direction={"row"} justifyContent={"space-between"}>
                      <Typography
                        fontWeight={"bold"}
                        style={{
                          color: "grey",
                        }}
                        sx={{ textTransform: "capitalize" }}
                      >
                        Account Name
                      </Typography>

                      <Typography fontWeight={"bold"}>
                        {paymentDetails?.name}
                      </Typography>
                    </Stack> */}
                    {fields.map((field) => (
                        <Stack
                          direction={"row"}
                          justifyContent={"space-between"}
                        >
                          <Typography
                            fontWeight={"bold"}
                            style={{
                              color: "grey",
                            }}
                            sx={{ textTransform: "capitalize" }}
                          >
                            {field[0]
                              .replace("_", " ")
                              .trim()
                              .replace(/[A-Z]/g, " $&")
                              .trim()}
                          </Typography>

                          <Typography fontWeight={"bold"}>
                            {field[1]}
                          </Typography>
                        </Stack>
                      ))}
                    <Divider />

                    <Typography
                      style={{
                        color: "#0060bf",
                        marginTop: "1em",
                      }}
                      fontWeight={"bold"}
                      fontSize={15}
                    >
                      You're about to pay
                    </Typography>

                    <Stack direction={"row"} justifyContent={"space-between"}>
                      <Typography
                        fontWeight={"bold"}
                        style={{
                          color: "grey",
                        }}
                        sx={{ textTransform: "capitalize" }}
                      >
                        Convenience Fee
                      </Typography>

                      {expanded === "panel2" ? (
                        <Typography fontWeight={"bold"}>{`0 PHP`}</Typography>
                      ) : (
                        <Typography
                          fontWeight={"bold"}
                          style={{ marginRight: "2em" }}
                        >{`${convenienceFee} ${platformVariables.currencySymbol}`}</Typography>
                      )}
                    </Stack>

                    <Stack direction={"row"} justifyContent={"space-between"}>
                      <Typography
                        fontWeight={"bold"}
                        style={{
                          color: "grey",
                        }}
                      >{`Total Amount`}</Typography>
                      <Typography
                        fontWeight={"bold"}
                        style={{ marginRight: "2em" }}
                      >{`${grandTotalFee} ${platformVariables.currencySymbol}`}</Typography>
                    </Stack>
                    <Box height={20} />
                    <Button
                      disabled={isLoadingPrivate}
                      variant="contained"
                      onClick={async () => {
                        const url = 'https://pm.link/123123123123123za23/test/DGSwn7b';
                        window.open(url, '_blank');
                        // setIsLoadingPrivate(true)
                        // await handleVortexCashRequest({
                        //   docId: transactionDocId,
                        //   total: grandTotalFee,
                        // })
                      }}
                    >
                      {isLoadingPrivate ? "Please wait..." : "RECEIVE PAYMENT"}
                    </Button>
                  </Stack>

                  {/* <Accordion expanded={expanded === 'panel1'} onChange={handleAccordionChange('panel1')}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      <Typography>Credit/Debit Card</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <PayPalScriptProvider
                        options={{
                          "client-id": process.env.GATSBY_PAYPAL_CLIENT_ID,
                          currency: "PHP",
                        }}
                      >
                        <PayPalButtons
                          createOrder={(data, actions) => {
                            return actions.order.create({
                              purchase_units: [
                                {
                                  amount: {
                                    //Vortex transaction amount
                                    value: grandTotalFee,
                                  },
                                  description: `Payment for ${selectedBiller?.name}`,
                                },
                              ],
                              application_context: {
                                brand_name: "Sparkle Star International",
                                shipping_preference: "NO_SHIPPING",
                              },
                            })
                          }}
                          onApprove={(data, actions) => {
                            return actions.order.capture().then(async (details) => {
                              let paymentData = {
                                data: data,
                                details: details,
                              }

                              await handleVortexRequest({
                                docId: transactionDocId,
                                paymentData: paymentData,
                              })
                            })
                          }}
                          style={{ layout: "vertical" }}
                        />
                      </PayPalScriptProvider>
                    </AccordionDetails>
                  </Accordion> */}
                  {/* <Accordion expanded={expanded === 'panel2'} onChange={handleAccordionChange('panel2')}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel2a-content"
                      id="panel2a-header"
                    >
                      <Typography>e-Wallet</Typography>
                    </AccordionSummary>
                    <AccordionDetails> */}
                  {/* <Typography>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                      malesuada lacus ex, sit amet blandit leo lobortis eget.
                    </Typography> */}

                  {/* </AccordionDetails>
                  </Accordion> */}
                </Box>
              </>
            )}
            <Backdrop
              sx={{ zIndex: 900 }}
              open={isLoadingPrivate}
              onClick={() => { }}
            >
              <CircularProgress />
            </Backdrop>
          </div>
        
       </Box>
    )
  }

  function FormRender(step) {
    switch (step) {
      case 0:
        return <BillsPaymentCategoriesPage />
      case 1:
        return <BillerDetails />
      case 2:
        return <ReviewConfirmationForm />
      default:

    }
  }

  return (
    <>
    <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            // pointerEvents: 'none',
            alignItems: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#fff',
            color: 'white',
            fontSize: '1.5rem',
          }}>
            {/* center the whole content using 50% of the screen on desktop and full on mobile */}
            {/* <div className="flex flex-col justify-center items-center w-full md:w-1/2 mx-auto"> */}
              <Box style={{
                width: '100%',
                height: '100%',
                // marginTop: '14em',
              }}>
                {FormRender(activeStep)}
              </Box>
          {/* </div> */}
      </div>
      <VortexBottomGradient />


      {platformVariables?.enableBills === false && <ServiceDisabledPrompt />}
      {storeStatus === 0 && <StoreBlockPrompt />}
      {userStatus === 0 && <BlockPrompt />}
      {userStatus === 1 && storeStatus === 1 && platformVariables?.enableBills && (
        <div>
          <Backdrop sx={{ zIndex: 900 }} open={isLoading} onClick={() => { }}>
            <CircularProgress />
          </Backdrop>
          {error.isError ? (
            <VortexError
              message={error.message}
              onClick={() => {
                setErrorData({
                  isError: false,
                  message: "",
                })
                setActiveStep(0)
              }}
            />
          ) : (
            <div
              style={{
                marginBottom: "5em",
              }}
            >
              {FormRender(activeStep)}
            </div>
          )}
          <VortexBottomGradient />
          <BottomNavigator />
        </div>
      )}
    </>
  )
}

export default VortexBillsPaymentPage
