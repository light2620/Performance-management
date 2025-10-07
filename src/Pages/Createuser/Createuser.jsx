import React, { useState } from 'react';
import "./style.css";
import DepartmentSelector from '../../Components/DepartmentSelector/DepartmentSelector';
import { createUserApi,getAllUser } from '../../Apis/UserApi';
import { IoClose } from "react-icons/io5";

import toast from 'react-hot-toast';
const CreateUser = ({onClose}) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    company_email: "",
    password: "",
    department_id: "" 
  });

  const [errors, setErrors] = useState({});
  const [loading,setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };
  const validate = () => {
  const newErrors = {};

  // First Name / Last Name: letters only
  if (!formData.first_name.trim()) {
    newErrors.first_name = "First name is required";
  } else if (!/^[A-Za-z\s]+$/.test(formData.first_name.trim())) {
    newErrors.first_name = "First name can only contain letters";
  }

  if (!formData.last_name.trim()) {
    newErrors.last_name = "Last name is required";
  } else if (!/^[A-Za-z\s]+$/.test(formData.last_name.trim())) {
    newErrors.last_name = "Last name can only contain letters";
  }

  // Phone: numeric, length 10-15 (you can adjust)
  if (!formData.phone.trim()) {
    newErrors.phone = "Phone is required";
  } else if (!/^\+?\d{10,20}$/.test(formData.phone.trim())) {
    newErrors.phone = "Phone must be atleast 10 digits";
  }

  // Email
  if (!formData.company_email.trim()) {
    newErrors.company_email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email.trim())) {
    newErrors.company_email = "Invalid email address";
  }

  // Department
  if (!formData.department_id) {
    newErrors.department_id = "Department is required";
  }

  // Password: min 6 characters
  if (!formData.password.trim()) {
    newErrors.password = "Password is required";
  } else if (formData.password.trim().length < 6) {
    newErrors.password = "Password must be at least 6 characters";
  }

  return newErrors;
};

   const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    // call API with formData
   try{
    setLoading(true)
    await createUserApi(formData);
    onClose();
        toast.success("user created")

   }catch(err){
   let errors = err?.response?.data;

  if (errors && typeof errors === "object") {
    Object.entries(errors).forEach(([key, value]) => {
      toast.error(value || "Something went wrong, try again...");
    });
  } else {
    // Covers unauthorized, network errors, no response, etc.
    toast.error("Something went wrong, try again...");
  }
   }finally{
    setLoading(false)
   }
  };

  return (
  <div className="create-user-modal">
   
    <div className="create-user-container">
       {
      <div className="close-modal-create-user" onClick={() => onClose()}><IoClose size={22} /></div>
    }
      <form className="create-user-form" onSubmit={handleSubmit}>
        <h2>Create User</h2>

        {/* First Name */}
        <div className="form-group">
          <label htmlFor="first_name">First Name :*</label>
          <div className="input-cont">
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={errors.first_name ? "error-input" : ""}
              placeholder="Enter first name"
            />
            {errors.first_name && <span className="error-text">{errors.first_name}</span>}
          </div>
        </div>

        {/* Last Name */}
        <div className="form-group">
          <label htmlFor="last_name">Last Name :*</label>
          <div className="input-cont">
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={errors.last_name ? "error-input" : ""}
              placeholder="Enter last name"
            />
            {errors.last_name && <span className="error-text">{errors.last_name}</span>}
          </div>
        </div>

        {/* Phone */}
        <div className="form-group">
          <label htmlFor="phone">Phone :*</label>
          <div className="input-cont">
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
               onChange={(e) => {
    let value = e.target.value;

    // allow only digits and one + at the start
    if (value.startsWith("+")) {
      // keep the leading + and remove other non-digit characters
      value = "+" + value.slice(1).replace(/\D/g, "");
    } else {
      // remove any non-digit characters
      value = value.replace(/\D/g, "");
    }

    setFormData({ ...formData, phone: value });
    if (errors.phone) setErrors({ ...errors, phone: "" });
  }}
              className={errors.phone ? "error-input" : ""}
              placeholder="+91 98765 43210"
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
        </div>
 
        {/* company_email */}
        <div className="form-group">
          <label htmlFor="company_email">company_email :*</label>
          <div className="input-cont">
            <input
              type="company_email"
              id="company_email"
              name="company_email"
              value={formData.company_email}
              onChange={handleChange}
              className={errors.company_email ? "error-input" : ""}
              placeholder="example@mail.com"
            />
            {errors.company_email && <span className="error-text">{errors.company_email}</span>}
          </div>
        </div>

      {/* Department (placed just below company_email) */}
        <div className="form-group">
          <label>Department :*</label>
          <div className="input-cont">
            <DepartmentSelector
              value={formData.department_id}
              onChange={(id) => {
                setFormData({ ...formData, department_id: id });
                if (errors.department_id) {
                  setErrors({ ...errors, department_id: "" });
                }
              }}
              error={errors.department_id}
            />
          </div>
        </div>
        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">Password :*</label>
          <div className="input-cont">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error-input" : ""}
              placeholder="Enter password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
         
         <button type="submit" disabled={loading} className="save-btn">
  {loading ? "Creating..." : "Create"}
</button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default CreateUser;
