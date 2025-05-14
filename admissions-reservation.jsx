"use client"

import { useState, useEffect } from "react"
import { MagnifyingGlassIcon, ChevronDownIcon, ArrowPathIcon, FunnelIcon } from "@heroicons/react/24/solid"
import { getFunctions, httpsCallable } from "firebase/functions"
import { useAuth } from "../../context/AuthContext" // Assuming context is two levels up

export default function ApplicantsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [applicants, setApplicants] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isCollegeOpen, setIsCollegeOpen] = useState(false)
  const [isProgramOpen, setIsProgramOpen] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [colleges, setColleges] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const functionsInstance = getFunctions(undefined, 'asia-southeast1') // Renamed for clarity
  const callGetAdmissionApplicants = httpsCallable(functionsInstance, 'getAdmissionApplicants') // Renamed for clarity

  const loadData = async (filters = {}) => { // Renamed from loadApplicants for clarity
    try {
      setLoading(true)
      setError(null)
      
      const filterCriteria = {
        search: filters.searchQuery !== undefined ? filters.searchQuery : searchQuery,
        college: filters.college !== undefined ? filters.college : selectedCollege,
        program: filters.program !== undefined ? filters.program : selectedProgram,
        status: filters.status !== undefined ? filters.status : selectedStatus,
      }

      // Ensure undefined filters are not sent or sent as empty strings if preferred by backend
      Object.keys(filterCriteria).forEach(key => {
        if (filterCriteria[key] === undefined || filterCriteria[key] === null) {
          filterCriteria[key] = ""; // Or delete filterCriteria[key]; depending on backend
        }
      });

      console.log("Calling getAdmissionApplicants with filters:", filterCriteria);
      const result = await callGetAdmissionApplicants({ filterCriteria })
      console.log("Received data from backend:", result.data);

      setApplicants(result.data.applicants || []) // Safeguard with || []
      setColleges(result.data.colleges || [])     // Safeguard with || []
      setPrograms(result.data.programs || [])     // Safeguard with || []

    } catch (err) {
      console.error('Error loading data:', err)
      setError(`Failed to load data: ${err.message}`)
      setApplicants([]) // Clear applicants on error
      setColleges([])   // Clear colleges on error
      setPrograms([])   // Clear programs on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.isAdmin) {
      console.log("User is admin, loading initial data.");
      loadData() // Load all data (applicants and filter options)
    } else if (user === null) { // Explicitly check for user being null (not yet loaded or not logged in)
        console.log("User not yet loaded or not logged in.");
        setLoading(true); // Keep loading true if user state is not determined
    } else if (user && !user.isAdmin) {
        console.log("User is not admin.");
        setError("You are not authorized to view this page.");
        setLoading(false);
        setApplicants([]);
        setColleges([]);
        setPrograms([]);
    }
  }, [user]) // Dependency array only includes user

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "NOT RESERVED":
        return "bg-red-500 text-white"
      case "RESERVED":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const handleSearchChange = (e) => { // Renamed from handleSearch to avoid confusion with filterCriteria.search
    setSearchQuery(e.target.value)
    loadData({ searchQuery: e.target.value }) // Pass new search query directly
  }

  const handleFilterChange = (type, value) => {
    let newFilters = {};
    if (type === 'college') {
      setSelectedCollege(value)
      setIsCollegeOpen(false)
      newFilters = { college: value, program: "", status: selectedStatus, searchQuery: searchQuery }; // Reset program when college changes
    } else if (type === 'program') {
      setSelectedProgram(value)
      setIsProgramOpen(false)
      newFilters = { program: value, college: selectedCollege, status: selectedStatus, searchQuery: searchQuery };
    } else if (type === 'status') {
      setSelectedStatus(value)
      setIsFilterOpen(false)
      newFilters = { status: value, college: selectedCollege, program: selectedProgram, searchQuery: searchQuery };
    }
    loadData(newFilters)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCollege("")
    setSelectedProgram("")
    setSelectedStatus("")
    loadData({ searchQuery: "", college: "", program: "", status: "" })
  }

  // UI remains largely the same, ensure correct mapping and display
  return (
    <div className="flex-1 bg-white overflow-auto p-6">
      <h1 className="text-black text-3xl font-bold mb-3">APPLICANTS LIST</h1>
      <div className="h-1 bg-black mb-8"></div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or applicant #"
            className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
            value={searchQuery}
            onChange={handleSearchChange} // Updated handler name
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
            >
              <FunnelIcon className="w-4 h-4" />
              <div className="flex items-center">{selectedStatus || "Status"}</div>
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button 
                    onClick={() => handleFilterChange('status', '')}
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${selectedStatus === '' ? 'font-bold' : ''}`}
                  >
                    All Statuses
                  </button>
                  <button 
                    onClick={() => handleFilterChange('status', 'RESERVED')}
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${selectedStatus === 'RESERVED' ? 'font-bold' : ''}`}
                  >
                    Reserved
                  </button>
                  <button 
                    onClick={() => handleFilterChange('status', 'NOT RESERVED')}
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${selectedStatus === 'NOT RESERVED' ? 'font-bold' : ''}`}
                  >
                    Not Reserved 
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* College Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsCollegeOpen(!isCollegeOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
            >
              <span>{selectedCollege || "COLLEGE"}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isCollegeOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 max-h-60 overflow-y-auto">
                <div className="py-1">
                  <button 
                    onClick={() => handleFilterChange('college', '')}
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${selectedCollege === '' ? 'font-bold' : ''}`}
                  >
                    All Colleges
                  </button>
                  {colleges.map((collegeName) => (
                    <button 
                      key={collegeName}
                      onClick={() => handleFilterChange('college', collegeName)}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${selectedCollege === collegeName ? 'font-bold' : ''}`}
                    >
                      {collegeName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Program Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProgramOpen(!isProgramOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
            >
              <span>{selectedProgram || "PROGRAM"}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isProgramOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 max-h-60 overflow-y-auto">
                <div className="py-1">
                  <button 
                    onClick={() => handleFilterChange('program', '')}
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${selectedProgram === '' ? 'font-bold' : ''}`}
                  >
                    All Programs
                  </button>
                  {programs.map((programName) => (
                    <button 
                      key={programName}
                      onClick={() => handleFilterChange('program', programName)}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${selectedProgram === programName ? 'font-bold' : ''}`}
                    >
                      {programName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={resetFilters}
            className="text-red-500 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Table Display */}
      <div className="w-full overflow-auto rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                APPLICANT #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                LAST NAME
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                FIRST NAME
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                M.I
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                COLLEGE
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                PROGRAM
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                STATUS
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
              ></th> {/* Action column */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading applicants...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-red-500">
                  {error} {/* Display more specific error if available */}
                </td>
              </tr>
            ) : applicants.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  No applicants found matching your criteria.
                </td>
              </tr>
            ) : (
              applicants.map((applicant) => (
                <tr key={applicant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{applicant.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{applicant.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{applicant.firstName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{applicant.mi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{applicant.college}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{applicant.program}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusBadgeClass(applicant.status)}`}>
                      {applicant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Replace with actual action, e.g., Link to profile or modal trigger */}
                    <button className="text-gray-600 hover:text-gray-900 focus:outline-none">View Profile</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 