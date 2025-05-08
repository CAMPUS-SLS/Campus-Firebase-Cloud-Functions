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
    timeslot t ON c.timeslot_id = t.timeslot_ida
WHERE 
    s.student_id = 'STUDENT_ID_HERE';=
    
//up = user_profile
//c - course
//s = student
//t = timeslot
//rm = room
//p = professor
//u = user



//c.course_id = subject_code
//c.course_title = subject_desc
//c.lec_units = lec_units
//c.lab_units = lab_units
//s.section_id = c.section_id = t.section_id = section
//t.weekday = day
//t.room_id = rm.room_id
//rm.floor_no, rm.building = location
//rm.room_no = room
//t.professor_id = p.professor_id  ->  p.user_id = u.user_id = up.user_id   ->  up.last_name + ", " + up.first_name = instructor
//c.course_id = t.course_id = 


    export const subjects = [
        {
          subject_id: 1,
          subject_code: "SUB0001",
          subject_desc: "DOLORIS LOREM IPSUM DOLOR SIT AMET",
          lec_units: 3,
          lab_units: 3,
          section: "1-A",
          location: "Ave Mujica Building",
          color: "#F7CA18", // yellow
          schedules: [
            {
              day: "MON",
              startTime: "7:00 AM",
              endTime: "8:00 AM",
              room: "Room 1234",
              instructor: "Lika Cruz",
            },
            {
              day: "THU",
              startTime: "6:00 PM",
              endTime: "9:00 PM",
              room: "Room 1234",
              instructor: "Lika Cruz",
            },
          ],
        },