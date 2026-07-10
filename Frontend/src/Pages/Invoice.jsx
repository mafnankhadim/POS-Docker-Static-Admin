import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import "../Styles/Invoice.css";
import { FaEye, FaEdit, FaTrash, FaPrint } from "react-icons/fa";
import logo from "../assets/images/black-pos-logo.png";

const API_URL = import.meta.env.VITE_API_URL;

const Invoice = () => {
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [storeDetails, setStoreDetails] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/invoice/getinvoices`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/detail/getDetail`)
      .then((response) => {
        if (response.data.length > 0) {
          setStoreDetails(response.data[0]); // Assuming there's only one store detail
        }
      })
      .catch((error) => {
        console.error("Error fetching store details", error);
      });
  }, []);

  const handleEditClick = (invoiceId) => {
    navigate(`/sales/newsale/${invoiceId}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/invoice/deleteinvoice/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete invoice");
      }

      setData((prevData) => prevData.filter((invoice) => invoice._id !== id));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Function to highlight search text in matching words
  const highlightText = (text, searchText) => {
    if (!searchText || !text) return text; // If no search or text is undefined, return normal text

    const regex = new RegExp(`(${searchText})`, "gi"); // Case-insensitive search
    return String(text).replace(regex, `<span class="highlight">$1</span>`);
  };

  const handlePrint = async (invoiceId) => {
    try {
      if (!invoiceId || typeof invoiceId !== "string") {
        console.error("Invoice ID is missing or invalid:", invoiceId);
        return;
      }

      console.log("Invoice ID received:", invoiceId);

      const response = await fetch(
        `${API_URL}/api/invoice/getinvoice/${invoiceId}`
      );
      if (!response.ok) throw new Error("Failed to fetch invoice");

      const invoice = await response.json();
      console.log("Invoice fetched successfully", invoice);

      const items = Array.isArray(invoice.items) ? invoice.items : [];

      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getFullYear()}`;
      };

      const formatTime = () => {
        const d = new Date();
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
      };

      const printContent = `
      <div style="width: 300px; font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: auto; padding: 10px; border: 1px solid #000;">
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="${logo}" alt="Company Logo" style="width: 80px; height: auto;" />
        </div>
    
        <h3 style="text-align: center; margin: 0; font-size: 16px; text-transform: uppercase;">${
          storeDetails.storeName
        }</h3>
        <p style="text-align: center; margin: 5px 0; font-size: 12px;">Phone: ${
          storeDetails.contactNo
        }</p>
        <p style="text-align: center; margin: 0; font-size: 10px;">Email: ${
          storeDetails.email
        }</p>
        <p style="text-align: center; margin: 5px 0; font-size: 12px;">Address: ${
          storeDetails.address
        }</p>

        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <p style="margin: 0; font-size: 12px;"><strong>Invoice No:</strong> ${
          invoice.invoiceNo
        }</p>
        <p style="margin: 0; font-size: 12px;"><strong>Customer Name:</strong> ${
          invoice.customerName
        }</p>
        <p style="margin: 0; font-size: 12px;"><strong>Contact:</strong> ${
          invoice.customerContactNo
        }</p>
        <p style="margin: 0; font-size: 12px;"><strong>Date:</strong> ${formatDate(
          invoice.createdAt
        )}</p>
        <p style="margin: 0; font-size: 12px;"><strong>Time:</strong> ${formatTime()}</p>
        <p style="margin: 0; font-size: 12px;"><strong> Billed By:</strong> ${
          invoice.billedBy
        }</p>
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              items.length > 0
                ? items
                    .map(
                      (item) => `
              <tr>
                <td style="text-align: left;">${item.ProductName}</td>
                <td style="text-align: center;">${item.Quantity}</td>
                <td style="text-align: right;">${item.RetailPrice}</td>
                <td style="text-align: right;">${(
                  item.RetailPrice * item.Quantity
                ).toFixed(2)}</td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="4" style="text-align: center;">No items</td></tr>`
            }
          </tbody>
        </table>
    
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <p style="margin: 0; font-size: 12px; text-align: right;"><strong>Total:</strong> Rs. ${
          invoice.totalAmount
        }</p>
        <p style="margin: 0; font-size: 12px; text-align: right;"><strong>Service Charges:</strong> Rs. ${
          invoice.serviceCharges || "0.00"
        }</p>
        <p style="margin: 0; font-size: 12px; text-align: right;"><strong>Grand Total:</strong> Rs. ${
          invoice.netTotal || invoice.totalAmount
        }</p>
    
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <p style="margin: 0; font-size: 12px; text-align: right;"><strong>Customer Paid:</strong> Rs. ${
          invoice.paidAmount || "0.00"
        }</p>
        <p style="margin: 0; font-size: 12px; text-align: right;"><strong>Change Amount:</strong> Rs. ${
          invoice.changeAmount || "0.00"
        }</p>
    
        <hr style="border: 1px dashed #000; margin: 10px 0;">
        <p style="text-align: center; margin: 0; font-size: 12px;">Thank you for your visit!</p>
        <p style="text-align: center; margin: 0; font-size: 10px;">This is a computer-generated invoice.</p>
      </div>
    `;

      const printWindow = window.open("", "_blank", "height=600,width=400");
      if (!printWindow) {
        console.error("Popup blocked! Please allow popups for this site.");
        return;
      }

      printWindow.document.write(printContent);
      printWindow.document.close();

      setTimeout(() => {
        const printResult = printWindow.print();
        if (printResult !== false) {
          printWindow.close();
        }
      }, 500);
    } catch (error) {
      console.error("Error fetching or printing the invoice:", error);
    }
  };

  const columns = [
    {
      name: "Invoice No",
      selector: (row) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(row.invoiceNo || "", searchText),
          }}
        />
      ),
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => {
        const date = new Date(row.createdAt);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      },
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row) => (
        <span
          dangerouslySetInnerHTML={{
            __html: highlightText(row.customerName || "", searchText),
          }}
        />
      ),
      sortable: true,
    },
    {
      name: "Customer Contact No",
      selector: (row) => row.customerContactNo,
      sortable: true,
    },
    {
      name: "Total Amount",
      selector: (row) => `Rs. ${row.totalAmount}`,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="action-buttons">
          <button
            className="view-btn"
            onClick={() => {
              setSelectedInvoice(row);
              setIsModalOpen(true);
            }}
          >
            <FaEye />
          </button>

          <button className="edit-btn" onClick={() => handleEditClick(row._id)}>
            <FaEdit />
          </button>
          <button className="print-btn" onClick={() => handlePrint(row._id)}>
            <FaPrint />
          </button>
          <button className="delete-btn" onClick={() => handleDelete(row._id)}>
            <FaTrash />
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  // Keyboard Shortcuts
  const handleKeyPress = (e) => {
    if (e.key === "Escape" && isModalOpen) {
      setIsModalOpen(false); // Close the modal when Escape is pressed
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isModalOpen]);

  return (
    <div className="invoice-container full-width">
      <h2 className="table-title">Invoice Table</h2>

      <div className="invoice-search">
        <input
          type="text"
          placeholder="Search invoice..."
          className="invoice-search-box"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading invoices...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          data={data.filter(
            (item) =>
              item.customerName
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              item.invoiceNo.toString().includes(searchText) ||
              item.customerContactNo.toString().includes(searchText)
          )}
          pagination
          highlightOnHover
        />
      )}

      {isModalOpen && selectedInvoice && (
        <div className="modal-overlay custom-modal-overlay">
          <div className="modal-content custom-modal-content">
            <span
              className="modal-close custom-modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>

            {/* Invoice Header */}
            <div className="custom-invoice-header custom-text-center">
              <h2>{storeDetails ? storeDetails.storeName : "Company Name"}</h2>
              <p>
                {storeDetails
                  ? storeDetails.address
                  : "123 Main Street, City, Country"}
              </p>
              <p>
                Email: {storeDetails ? storeDetails.email : "info@company.com"}{" "}
                | Phone:{" "}
                {storeDetails ? storeDetails.contactNo : "(123) 456-7890"}
              </p>
            </div>

            <hr className="custom-divider" />

            {/* Invoice Details */}
            <div className="custom-invoice-details">
              <div className="custom-invoice-flex">
                <p>
                  <strong>Invoice No:</strong> {selectedInvoice.invoiceNo}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="custom-invoice-flex">
                <p>
                  <strong>Customer Name:</strong> {selectedInvoice.customerName}
                </p>
                <p>
                  <strong>Contact No:</strong>{" "}
                  {selectedInvoice.customerContactNo}
                </p>
              </div>
              <div className="custom-invoice-flex">
                <p>
                  <strong>Billed By:</strong> {selectedInvoice.billedBy}
                </p>
              </div>
            </div>

            <hr className="custom-divider" />

            {/* Invoice Items Table */}
            <table className="custom-invoice-table">
              <thead>
                <tr className="custom-table-header">
                  <th className="custom-table-th">#</th>
                  <th className="custom-table-th">Product Name</th>
                  <th className="custom-table-th">Quantity</th>
                  <th className="custom-table-th">Price</th>
                  <th className="custom-table-th">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, index) => {
                  const RetailPrice = item.RetailPrice || 0;
                  return (
                    <tr key={index} className="custom-table-row">
                      <td className="custom-table-td">{index + 1}</td>
                      <td className="custom-table-td">
                        {item.ProductName || "N/A"}
                      </td>
                      <td className="custom-table-td">{item.Quantity || 0}</td>
                      <td className="custom-table-td">
                        Rs. {Number(RetailPrice).toFixed(2)}
                      </td>
                      <td className="custom-table-td">
                        Rs.{" "}
                        {(
                          Number(item.Quantity || 0) * Number(RetailPrice)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total Amount */}
            <div className="custom-invoice-total custom-text-right">
              <h3>
                Total: Rs. {selectedInvoice.totalAmount?.toFixed(2) || "0.00"}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
