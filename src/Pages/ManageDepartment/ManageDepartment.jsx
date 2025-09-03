import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { setDepartment } from "../../Redux/DepartmentSlice";
import AddDepartment from "../../Components/AddDepartment/AddDepartment";
import DepartmentsTable from "../../Components/DepartmentsTable/DepartmentsTable";
import axiosInstance from "../../Apis/axiosInstance";
import { addDepartment, editDepartment, deleteDepartment } from "../../Apis/DepartmentApis";
import "./style.css";

const API_BASE = "/departments/";

const ManageDepartment = () => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [prev, setPrev] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("");

  const params = useMemo(() => {
    const p = {};
    if (search.trim()) p.search = search.trim();
    if (ordering.trim()) p.ordering = ordering.trim();
    return p;
  }, [search, ordering]);

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

  const handleAdd = async (deptName, reset) => {
    try {
      await addDepartment({ dept_name: deptName });
      reset?.();
      fetchDepartments(API_BASE, params);
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to add department");
    }
  };

  const handleEdit = async ({ id, dept_name }) => {
    try {
      await editDepartment(id, { dept_name });
      fetchDepartments(API_BASE, params);
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to update department");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await deleteDepartment(id);
      fetchDepartments(API_BASE, params);
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to delete department");
    }
  };

  return (
    <div className="manageDeptComp-page">
      <div className="manageDeptComp-header">
        <h2 className="manageDeptComp-title">Manage Departments</h2>
        <div className="manageDeptComp-filters">
          <input
            className="manageDeptComp-input"
            placeholder="Search department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="manageDeptComp-select"
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
          <button
            className="manageDeptComp-btn"
            onClick={() => fetchDepartments(API_BASE, params)}
          >
            Apply
          </button>
        </div>
      </div>

      <AddDepartment onAdd={handleAdd} />

      {err && <div className="manageDeptComp-error">{err}</div>}

      <DepartmentsTable
        rows={rows}
        loading={loading}
        total={count}
        next={next}
        previous={prev}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNext={() => next && fetchDepartments(next)}
        onPrev={() => prev && fetchDepartments(prev)}
        onRefresh={() => fetchDepartments(API_BASE, params)}
      />
    </div>
  );
};

export default ManageDepartment;
