# User Acceptance Testing (UAT) Evaluation Questionnaire

**System:** University Mental Health Support: Semi-Anonymous Student Counseling and Resource Mapping Web Application (SafeSpace, UST-Legazpi)
**Researchers:** Joshua Klein A. Malonda & Hanz Gregor P. Loria — BS Computer Science, University of Santo Tomas–Legazpi
**Framework:** ISO/IEC 25010 Software Product Quality (user-observable characteristics only)
**Scale:** 5-point Likert — 5 Strongly Agree · 4 Agree · 3 Neutral · 2 Disagree · 1 Strongly Disagree
**Estimated time:** 20–30 minutes

> **Purpose.** This questionnaire determines whether the system is *acceptable for deployment* from the perspective of its intended users. There are no right or wrong answers — evaluate only what you personally experienced while testing.
>
> **Confidentiality & consent.** Participation is voluntary. Responses are anonymous and will be used solely for this undergraduate thesis. Test accounts are provided; please do not enter real personal information. By proceeding, you consent to participate.

**Instructions.** (1) Use the provided test account and device. (2) Work through the task scripts in Part III *before* answering Parts II and IV. (3) For each statement, encircle/check the number that best reflects your experience. (4) Write legibly in the remarks boxes.

---

## Part I — Respondent Profile

| # | Item | Response |
|---|------|----------|
| 1 | Role | [ ] Student &nbsp;&nbsp; [ ] Counselor |
| 2 | Age bracket | [ ] 18–20 &nbsp;&nbsp; [ ] 21–23 &nbsp;&nbsp; [ ] 24–26 &nbsp;&nbsp; [ ] 27 and above |
| 3 | Sex | [ ] Male &nbsp;&nbsp; [ ] Female &nbsp;&nbsp; [ ] Prefer not to say |
| 4 | Department *(students)* | [ ] CEAFA &nbsp;&nbsp; [ ] CHS &nbsp;&nbsp; [ ] CASE &nbsp;&nbsp; [ ] CBMA |
| 5 | Year level *(students)* | [ ] 1st &nbsp;&nbsp; [ ] 2nd &nbsp;&nbsp; [ ] 3rd &nbsp;&nbsp; [ ] 4th &nbsp;&nbsp; [ ] 5th |
| 6 | Years of counseling experience *(counselors)* | [ ] <1 &nbsp;&nbsp; [ ] 1–3 &nbsp;&nbsp; [ ] 4–6 &nbsp;&nbsp; [ ] 7+ |
| 7 | Device used for testing | [ ] Android phone &nbsp;&nbsp; [ ] iPhone &nbsp;&nbsp; [ ] Laptop/Desktop &nbsp;&nbsp; [ ] Tablet |
| 8 | Browser used | [ ] Chrome &nbsp;&nbsp; [ ] Edge &nbsp;&nbsp; [ ] Firefox &nbsp;&nbsp; [ ] Safari &nbsp;&nbsp; [ ] Other: ______ |
| 9 | Have you used an online counseling or telehealth system before? | [ ] Yes &nbsp;&nbsp; [ ] No |

---

## Part II — ISO 25010 Quality Evaluation

### A. Functional Suitability — *does the system do what it should?*

**Students — answer A1–A10. Counselors — answer A11–A20.**

| # | Statement (Student) | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| A1 | I was able to create an account using my university email and activate it through the verification link. | | | | | |
| A2 | I was able to sign in, use "Forgot password?", and recover my account through the emailed code. | | | | | |
| A3 | I was able to book a face-to-face session for a counselor's available date and time. | | | | | |
| A4 | I was able to request a chat session and exchange messages with a counselor. | | | | | |
| A5 | I was able to record journal entries and view my weekly mood graph and activity. | | | | | |
| A6 | I was able to explore self-care modules and their guided activities. | | | | | |
| A7 | I was able to find support services using the resource directory and map. | | | | | |
| A8 | I was able to read OGT announcements/updates and view their details. | | | | | |
| A9 | I was able to submit concerns through the Help Desk (Suggestions). | | | | | |
| A10 | I was able to manage my profile and privacy preferences (e.g., name visibility, update notifications). | | | | | |

| # | Statement (Counselor) | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| A11 | I was able to view incoming session requests and accept or decline them. | | | | | |
| A12 | I was able to manage my availability schedule (dates, time slots, face-to-face/chat). | | | | | |
| A13 | I was able to conduct chat sessions and voice calls with students from my dashboard. | | | | | |
| A14 | I was able to post, edit, and manage OGT announcements for students. | | | | | |
| A15 | I was able to add and manage self-care modules and resources. | | | | | |
| A16 | The dashboard gave me a complete and correct view of my sessions and upcoming appointments. | | | | | |
| A17 | The student identity reveal process worked only when the permitted conditions were met. | | | | | |
| A18 | High-risk messages were correctly flagged for my attention during chat sessions. *(staged test data)* | | | | | |
| A19 | Session records, call logs, and shared files were complete and accurate. | | | | | |
| A20 | The counselor notice displayed on my dashboard was correct and easy to update. | | | | | |

### B. Usability — *is it easy to learn and use?* (all respondents)

| # | Statement | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| B1 | I learned to use the system quickly without needing a manual or assistance. | | | | | |
| B2 | The sidebar navigation made it easy to find every feature I needed. | | | | | |
| B3 | Buttons, labels, and instructions were clear and understandable. | | | | | |
| B4 | The layout and visual design were clean and consistent on every page. | | | | | |
| B5 | The system worked well on my device's screen size (phone/tablet/desktop). | | | | | |
| B6 | Error messages clearly told me what went wrong and how to fix it. | | | | | |
| B7 | I could easily undo or recover from my own mistakes (e.g., wrong input, accidental action). | | | | | |
| B8 | Overall, the system is pleasant and comfortable to use. | | | | | |

### C. Reliability — *does it work consistently?* (all respondents)

| # | Statement | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| C1 | The system remained stable throughout my testing (no crashes or frozen pages). | | | | | |
| C2 | My data (messages, journal entries, bookings) was still intact after refreshing or reopening the system. | | | | | |
| C3 | Chat messages and session updates appeared promptly without needing to refresh. | | | | | |
| C4 | Voice calls connected successfully and stayed connected for the session duration. *(if tested)* | | | | | |

### D. Security — *is my information protected?* (all respondents)

| # | Statement | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| D1 | I am confident that only authorized users can access my account (ID + password, with optional PIN/authenticator). | | | | | |
| D2 *(students)* | I trust that counselors see my real name only when I allow it in my preferences. | | | | | |
| D2 *(counselors)* | I could only view a student's identity under the permitted conditions. | | | | | |
| D3 | I believe my personal information and conversation content are kept private. | | | | | |
| D4 | I received appropriate alerts about account activity (e.g., password change notifications). | | | | | |

### E. Performance Efficiency & Portability — *is it fast and device-independent?* (all respondents)

| # | Statement | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| E1 | Pages and content loaded within an acceptable waiting time. | | | | | |
| E2 | The system performed well on my internet connection without long delays. | | | | | |
| E3 | The system worked correctly on my device and browser without requiring installation or special setup. | | | | | |

> **Scope note.** Of the eight ISO 25010 characteristics, *Maintainability* is excluded because it is not observable by end users (it is assessed through code review instead). All included items map to user-observable behavior of this system.

---

## Part III — Task-Based Acceptance (complete BEFORE Part II)

Mark **P** (Pass) or **F** (Fail) against the expected result. Any **F** must have a remark.

### Student tasks (use the provided student test account)

| # | Task | Expected result | P/F | Remarks |
|---|---|---|---|---|
| T-S1 | Sign up with a `@ust-legazpi.edu.ph` email; open the verification link from the inbox. | Account activates; sign-in becomes possible. | | |
| T-S2 | Sign in, then sign out. | Lands on student home; sign-out returns to login. | | |
| T-S3 | Use "Forgot password?" with your test ID and set a new password using the emailed code. | New password signs in successfully. | | |
| T-S4 | Book a face-to-face session with an available counselor, date, and time. | Booking appears in Sessions as pending/confirmed. | | |
| T-S5 | Request a chat session; after acceptance, send messages and (if available) start a voice call. | Messages deliver in real time; call connects with audio. | | |
| T-S6 | Write a journal entry and check the weekly mood graph and streak. | Entry saved; graph and streak update. | | |
| T-S7 | Open Self-Care, Resources (map + directory), and OGT Updates; react to one announcement. | Content loads; reaction count updates. | | |
| T-S8 | Submit a concern via Help Desk; toggle a privacy preference in My Account. | Concern submits; preference change is saved and reflected. | | |

### Counselor tasks (use the provided counselor test account)

| # | Task | Expected result | P/F | Remarks |
|---|---|---|---|---|
| T-C1 | Sign in and review the dashboard (sessions, requests, notice). | Dashboard figures match the test data. | | |
| T-C2 | Accept one pending session request and decline another. | Student side reflects accepted/declined status. | | |
| T-C3 | Set availability slots and block/make available one date. | Students see the updated availability when booking. | | |
| T-C4 | Open the accepted chat session; reply to the student and review any flagged high-risk message. *(staged test data)* | Messages deliver; flagged message is distinguishable. | | |
| T-C5 | Post an OGT announcement with an image, then edit it. | Announcement appears to students immediately. | | |
| T-C6 | Add one self-care module (with an activity) and one resource entry. | Both appear on the student side. | | |
| T-C7 | Update the dashboard notice text. | New notice displays on the counselor dashboard and student home. | | |

---

## Part IV — Open-Ended Feedback

1. What is the **most useful** feature of the system, and why?
   ___________________________________________________________________________
2. What was the **most confusing or difficult** part to use, and why?
   ___________________________________________________________________________
3. Did you encounter any **errors or bugs**? Describe the exact steps to reproduce them.
   ___________________________________________________________________________
4. What **feature is missing** that you expected or needed?
   ___________________________________________________________________________
5. Any other comments or suggestions for improvement:
   ___________________________________________________________________________

---

## Part V — Overall Acceptance

| # | Statement | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|
| O1 | **Overall, the system is acceptable for deployment to its intended users.** | | | | | |

**Respondent conforme:**

Printed Name: ______________________________ &nbsp;&nbsp; Signature: ______________________________ &nbsp;&nbsp; Date: __________

---

## Scoring & Interpretation Guide *(for researchers — detach before distribution)*

1. **Per-item mean** = Σ ratings ÷ n respondents (compute separately per role where items differ).
2. **Characteristic score** = mean of its items. **Overall score** = mean of O1, reported alongside characteristic means.
3. **Interpretation scale:**

| Mean range | Interpretation | Action |
|---|---|---|
| 4.20 – 5.00 | Highly Acceptable | Deploy; minor polish optional |
| 3.40 – 4.19 | Acceptable | Deploy; address failed tasks + open-ended issues |
| 2.60 – 3.39 | Moderately Acceptable | Revise flagged items, re-test affected modules |
| 1.80 – 2.59 | Fairly Acceptable | Major revision required before deployment |
| 1.00 – 1.79 | Not Acceptable | Do not deploy; redesign failing characteristics |

4. **Acceptance criterion (default):** overall mean **≥ 4.00** with **no characteristic below 3.40** and **zero unresolved critical (data-loss/security) task failures**. Adjust only with adviser approval.
5. **Task results:** report pass rate per task; every **F** must trace to a remediation entry (fixed, deferred with justification, or by-design with explanation).
6. **Qualitative data:** code Part IV responses into themes (usability, bugs, feature requests) and summarize frequencies in the results chapter.
