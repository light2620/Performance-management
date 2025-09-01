import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { setDepartment } from "../../Redux/DepartmentSlice";
import AddDepartment from "../../Components/AddDepartment/AddDepartment";
import DepartmentsTable from "../../Components/DepartmentsTable/DepartmentsTable";
import axiosInstance from "../../Apis/axiosInstance";
import { addDepartment } from "../../Apis/DepartmentApis";
import { editDepartment } from "../../Apis/DepartmentApis";
import { deleteDepartment } from "../../Apis/DepartmentApis";
import "./style.css";

const API_BASE = "/departments/"; // list + create

const ManageDepartment = () => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [prev, setPrev] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState(""); // "dept_name" | "-created_at" etc.

  const params = useMemo(() => {
    const p = {};
    if (search.trim()) p.search = search.trim();
    if (ordering.trim()) p.ordering = ordering.trim();
    return p;
  }, [search, ordering]);

  // if server returns absolute next/previous, axios can still fetch them.
  const fetchDepartments = async (url = API_BASE, p = params) => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await axiosInstance.get(url, { params: p });
      setRows(data?.results || []);
      setCount(data?.count || 0);
      setNext(data?.next || null);
      setPrev(data?.previous || null);
      dispatch(setDepartment(data?.results || []));
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Something went wrong";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments(API_BASE, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  // ---- CRUD handlers (you said you'll wire these; here are ready-to-go stubs) ----
  const handleAdd = async (deptName, reset) => {
    try {
      await addDepartment({dept_name: deptName});
      reset?.();
      fetchDepartments(API_BASE, params);
    } catch (e) {
      alert(
        e?.response?.data?.detail ||
          e?.response?.data?.message ||
          "Failed to add department"
      );
    }
  };

  const handleEdit = async ({ id, dept_name }) => {
    try {
      await editDepartment(id,{dept_name});
      fetchDepartments(API_BASE, params);
    } catch (e) {
      alert(
        e?.response?.data?.detail ||
          e?.response?.data?.message ||
          "Failed to update department"
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await deleteDepartment(id);
      fetchDepartments(API_BASE, params);
    } catch (e) {
      alert(
        e?.response?.data?.detail ||
          e?.response?.data?.message ||
          "Failed to delete department"
      );
    }
  };

  return (
    <div className="manage-dept-page">
      <div className="manage-dept-header">
        <h2>Manage Departments</h2>
        <div className="manage-dept-filters">
          <input
            className="manage-dept-input"
            placeholder="Search department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="manage-dept-select"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
          >
            <option value="">Order: Default</option>
            <option value="dept_name">Dept Name ↑</option>
            <option value="-dept_name">Dept Name ↓</option>
            <option value="created_at">Created ↑</option>
            <option value="-created_at">Created ↓</option>
            <option value="updated_at">Updated ↑</option>
            <option value="-updated_at">Updated ↓</option>
          </select>
          <button className="manage-dept-btn" onClick={() => fetchDepartments(API_BASE, params)}>
            Apply
          </button>
        </div>
      </div>

      <AddDepartment onAdd={handleAdd} />

      {err && <div className="manage-dept-error">{err}</div>}

      <DepartmentsTable
        rows={rows}
        loading={loading}
        total={count}
        next={next}
        previous={prev}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNext={() => next && fetchDepartments(next)}      // handles absolute URLs
        onPrev={() => prev && fetchDepartments(prev)}      // handles absolute URLs
        onRefresh={() => fetchDepartments(API_BASE, params)}
      />
    </div>
  );
};

export default ManageDepartment;

