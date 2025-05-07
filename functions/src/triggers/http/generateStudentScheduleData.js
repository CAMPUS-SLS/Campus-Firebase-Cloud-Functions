//idk using as a note for now

SELECT 
    s.student_id,
    s.student_name,
    c.course_name,
    t.timeslot_day,
    t.timeslot_time
FROM 
    student s
JOIN 
    enrollment e ON s.student_id = e.student_id
JOIN 
    course c ON e.course_id = c.course_id
JOIN 
    timeslot t ON c.timeslot_id = t.timeslot_id
WHERE 
    s.student_id = 'STUDENT_ID_HERE';