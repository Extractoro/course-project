# EventNest - Web platform for booking ticket for events

Development of a web platform for booking tickets to events using modern web technologies. The goal is to create an application that will allow users to view events, book tickets, and administrators to manage events.


## Tech Stack

**Client:** Typescript, React, Redux Toolkit (RTK Query), SASS

**Server:** NodeJS, Express, MySQL


## User roles

The users of the information system are:

- Ordinary users - can browse the list of available events, search for them by category or date, and book tickets.

- Administrators - manage the list of events, add new events, set prices, and update information about available tickets.


## Features

### For ordinary users
- Sign up/sign in and email verification
- Viewing events using filtering
- Viewing and changing your profile (e.g. changing your name, email, password, etc.)
- Book tickets and view them with detailed information.
- Buy or return a ticket, if necessary

### For administrators
- Add, edit and delete information about events and venues
- Control the number of available tickets
- They have access to ticket sales statistics.


## Screenshots
1) User registration page. Fill out the registration form. ![Screenshot 1](./frontend/readmeScreenshots/image10.png)
2) Registration is successful. ![Screenshot 2](./frontend/readmeScreenshots/image11.png)
3) Check the email we have registered. ![Screenshot 3](./frontend/readmeScreenshots/image15.png) ![Screenshot 4](./frontend/readmeScreenshots/image16.png)
4) Enter our data and log in to the system. ![Screenshot 5](./frontend/readmeScreenshots/image17.png) ![Screenshot 6](./frontend/readmeScreenshots/image18.png)
5) The user can use filters. ![Screenshot 7](./frontend/readmeScreenshots/image20.png)
6) The user's page. Basic profile information is shown. It is possible to change the profile. ![Screenshot 8](./frontend/readmeScreenshots/image21.png) ![Screenshot 9](./frontend/readmeScreenshots/image22.png) ![Screenshot 10](./frontend/readmeScreenshots/image23.png)
7) Page of a specific event. ![Screenshot 11](./frontend/readmeScreenshots/image24.png)
8) Successfully booked tickets. ![Screenshot 12](./frontend/readmeScreenshots/image26.png)
9) My Tickets page. We see the event we just booked. Clicking on the event opens a list with each ticket. ![Screenshot 13](./frontend/readmeScreenshots/image27.png) ![Screenshot 14](./frontend/readmeScreenshots/image28.png)
10) When you click on the “Return ticket” button, which opens the form for returning the ticket, successful return and purchase of the ticket. ![Screenshot 15](./frontend/readmeScreenshots/image29.png) ![Screenshot 16](./frontend/readmeScreenshots/image31.png) ![Screenshot 17](./frontend/readmeScreenshots/image33.png)
11) Ticket status changed to “paid”. ![Screenshot 18](./frontend/readmeScreenshots/image34.png)
12) Resetting the password. ![Screenshot 19](./frontend/readmeScreenshots/image36.png) ![Screenshot 20](./frontend/readmeScreenshots/image37.png) ![Screenshot 21](./frontend/readmeScreenshots/image38.png) ![Screenshot 22](./frontend/readmeScreenshots/image39.png) ![Screenshot 23](./frontend/readmeScreenshots/image40.png)

### Admin features:
13) Adding an event. ![Screenshot 24](./frontend/readmeScreenshots/image44.png) ![Screenshot 25](./frontend/readmeScreenshots/image45.png) ![Screenshot 26](./frontend/readmeScreenshots/image46.png) ![Screenshot 27](./frontend/readmeScreenshots/image47.png) ![Screenshot 28](./frontend/readmeScreenshots/image48.png)
14) A specific event on the part of the administrator. We see new buttons “Edit ticket” and “Delete ticket”. ![Screenshot 29](./frontend/readmeScreenshots/image49.png)
15) Changing the event. ![Screenshot 30](./frontend/readmeScreenshots/image50.png) ![Screenshot 31](./frontend/readmeScreenshots/image51.png) ![Screenshot 32](./frontend/readmeScreenshots/image52.png) ![Screenshot 33](./frontend/readmeScreenshots/image53.png)
16) Deleting an event. ![Screenshot 34](./frontend/readmeScreenshots/image54.png) ![Screenshot 35](./frontend/readmeScreenshots/image55.png)
17) Program statistics. ![Screenshot 36](./frontend/readmeScreenshots/image56.png) ![Screenshot 37](./frontend/readmeScreenshots/image57.png)


## For self-testing
1) User:
   - email: user@gmail.com
   - password: user
2)  Admin:
    - email: admin@gmail.com
    - password: admin
