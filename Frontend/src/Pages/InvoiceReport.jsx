import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import "../Styles/InvoiceReport.css";
import axios from "axios";
import { FaEye, FaDownload } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL;

const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString(
    "en-CA"
  );
};

const getTodayDate = () => {
  return new Date().toLocaleDateString("en-CA");
};

const InvoiceReport = () => {
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeDetails, setStoreDetails] = useState(null);

  useEffect(() => {
    const fetchInvoicesByDateRange = async () => {
      if (!startDate || !endDate) return; // Prevent request if no dates selected

      try {
        const response = await fetch(
          `${API_URL}/api/invoice/getInvoicesByDateRange?startDate=${startDate}&endDate=${endDate}`
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

    fetchInvoicesByDateRange();
  }, [startDate, endDate]); // Trigger request when dates change

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

  const highlightText = (text, searchText) => {
    if (!searchText || !text) return text;
    const regex = new RegExp(`(${searchText})`, "gi");
    return String(text).replace(regex, `<span class="highlight">$1</span>`);
  };

  const filteredData = data.filter((item) => {
    const invoiceDate = new Date(item.createdAt).toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.invoiceNo.toString().includes(searchText);
    const withinDateRange =
      (!startDate || invoiceDate >= startDate) &&
      (!endDate || invoiceDate <= endDate);

    return matchesSearch && withinDateRange;
  });

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
      name: "Total Amount",
      selector: (row) => `Rs. ${row.totalAmount}`,
      sortable: true,
    },
    {
      name: "Profit",
      selector: (row) => `Rs. ${row.totalProfit}`,
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
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  const handleDownload = () => {
    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Invoice Report", 14, 10);

    // Define table headers
    const headers = [
      ["#", "Invoice No", "Customer Name", "Date", "Profit", "Total Amount"],
    ];

    // Define table data
    const data = filteredData.map((invoice, index) => [
      index + 1,
      invoice.invoiceNo,
      invoice.customerName,
      new Date(invoice.createdAt).toLocaleDateString(),
      `Rs. ${invoice.totalProfit?.toFixed(2) || "0.00"}`,
      `Rs. ${invoice.totalAmount?.toFixed(2) || "0.00"}`,
    ]);

    // Calculate Grand Total Amount & Total Profit
    const grandTotalAmount = filteredData.reduce(
      (sum, invoice) => sum + (invoice.totalAmount || 0),
      0
    );
    const totalProfit = filteredData.reduce(
      (sum, invoice) => sum + (invoice.totalProfit || 0),
      0
    );

    // Generate table
    autoTable(doc, {
      startY: 20,
      head: headers,
      body: data,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: {
        fillColor: "#1e1e2f",
        textColor: "#ffffff",
        fontStyle: "bold",
      },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold" }, // Align Total Amount column
      },
      margin: { top: 20 },
    });

    // Position for Total Profit and Grand Total Amount outside the table
    const finalY = doc.lastAutoTable.finalY + 10; // Get last position of table

    // Style and Add Total Profit
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Total Profit: Rs. ${totalProfit.toFixed(2)}`, 14, finalY);

    // Style and Add Grand Total Amount
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0); // Red color for emphasis
    doc.text(
      `Grand Total Amount: Rs. ${grandTotalAmount.toFixed(2)}`,
      14,
      finalY + 8
    );

    // Save the PDF
    doc.save("Invoice_Report.pdf");
  };

  return (
    <div className="invoice-container full-width">
      <h2 className="table-title">Invoice Report</h2>
      <div className="invoice-filters">
        <div className="date-filters">
          <input
            type="date"
            className="date-picker"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="date-picker"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="search-download-container">
          <input
            type="text"
            placeholder="Search invoice..."
            className="invoice-search-box"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button className="download-btn" onClick={handleDownload}>
            <FaDownload size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading invoices...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
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

export default InvoiceReport;
