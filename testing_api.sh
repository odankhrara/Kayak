#!/bin/bash

printf "\n--------------------------------\n"

echo "Bidding Trace"
printf "\n--------\n"

curl http://localhost:8004/api/admin/host/bidding-trace -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTktOTktOTk5OSIsImVtYWlsIjoiYWRtaW5Aa2F5YWsuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzY0NzMwMzQ1LCJleHAiOjE3NjUzMzUxNDV9.7bPnptYd9UogSzf1ZqPWwpt3YffOu5Aw4e3kdjFgsyU"

printf "\n\n\n--------------------------------\n"

echo "User Trace"
printf "\n--------\n"

curl -s http://localhost:8004/api/admin/host/user-trace -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTktOTktOTk5OSIsImVtYWlsIjoiYWRtaW5Aa2F5YWsuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzY0NzMwMzQ1LCJleHAiOjE3NjUzMzUxNDV9.7bPnptYd9UogSzf1ZqPWwpt3YffOu5Aw4e3kdjFgsyU"
printf "\n\n\n--------------------------------\n"

echo "Property Reviews"
printf "\n--------\n"

curl http://localhost:8004/api/admin/host/property-reviews -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTktOTktOTk5OSIsImVtYWlsIjoiYWRtaW5Aa2F5YWsuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzY0NzMwMzQ1LCJleHAiOjE3NjUzMzUxNDV9.7bPnptYd9UogSzf1ZqPWwpt3YffOu5Aw4e3kdjFgsyU"

printf "\n\n\n--------------------------------\n"

echo "Least Seen Areas"
printf "\n--------\n"

curl http://localhost:8004/api/admin/host/least-seen-areas -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTktOTktOTk5OSIsImVtYWlsIjoiYWRtaW5Aa2F5YWsuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzY0NzMwMzQ1LCJleHAiOjE3NjUzMzUxNDV9.7bPnptYd9UogSzf1ZqPWwpt3YffOu5Aw4e3kdjFgsyU"

printf "\n\n\n--------------------------------\n"

echo "Property Clicks"
printf "\n--------\n"

curl http://localhost:8004/api/admin/host/property-clicks -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTktOTktOTk5OSIsImVtYWlsIjoiYWRtaW5Aa2F5YWsuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzY0NzMwMzQ1LCJleHAiOjE3NjUzMzUxNDV9.7bPnptYd9UogSzf1ZqPWwpt3YffOu5Aw4e3kdjFgsyU"

printf "\n\n\n-----------------------------------\n"

echo "Clicks Per Page"
printf "\n--------\n"

curl http://localhost:8004/api/admin/host/clicks-per-page -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTktOTktOTk5OSIsImVtYWlsIjoiYWRtaW5Aa2F5YWsuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzY0NzMwMzQ1LCJleHAiOjE3NjUzMzUxNDV9.7bPnptYd9UogSzf1ZqPWwpt3YffOu5Aw4e3kdjFgsyU"

printf "\n\n\n-----------------------------------\n"