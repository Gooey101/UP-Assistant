import urllib.request
import json
import requests

# Estimates cost of trip between locations
def get_quote_price(origin, destination):
    origin = origin.replace(" ", "+") + "+USA"
    destination = destination.replace(" ", "+") + "+USA"
    origin = origin.replace(",", "")
    destination = destination.replace(",", "")

    url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + origin + "&destinations=" + destination
    contents = urllib.request.urlopen(url).read()
    response = requests.get(url)
    obj = json.loads(response.content.decode('utf-8'))
    distance = obj['rows'][0]['elements'][0]['distance']['text'][:-2]
    distance = distance.replace(',', '')
    cost = float(distance) * 3.15
    cost = str('${:,.2f}'.format(cost))
    return cost

# Retrieves car data in JSON format
def get_data(car_id):
    url = 'http://198.47.241.137:1337/car/' + car_id
    data = requests.get(url).json()
    return data

# Checks if car is valid
def is_car(car_id):
    data = get_data(car_id)
    return 'id' in data

# Retrieves car information
def get_car_info(car_id):
    data = get_data(car_id)
    car_id = data['id']
    car_type = data['carType']
    empty = data['empty']
    if empty == 'true':
        return car_id + ' is an empty ' + car_type + ' car.'
    else:
        commodity = data['commodity']
        return car_id + ' is a(n) ' + car_type + ' full of ' + commodity + '.'

# Retrieves & calculates percentage of journey completed
def get_car_status(car_id):
    data = get_data(car_id)
    
    completed_events = data['completedEvents']
    num_completed = float(len(completed_events))
    
    remaining_events = data['scheduledEvents']
    num_remaining = float(len(remaining_events))
    
    if (num_completed == 0 and num_remaining == 0):
        return 'Progress: 0%'
    denominator = num_completed + num_remaining
    completion_percent = (num_completed / denominator)
    completion_percent = "{0:.2%}".format(completion_percent)

    return 'Progress: ' + completion_percent

# Retrieves & formats estimated time of arrival
def get_car_eta(car_id):
    data = get_data(car_id)
    eta = data['eta']

    year = eta[:4]
    month = eta[5:7]
    day = eta[8:10]
    hour = (int)(eta[11:13]) % 12
    min = eta[14:16]
    if (int)(eta[11:13]) > 12:
        ampm = "pm"
    else:
        ampm = "am"

    switcher = {
        '01': 'January',
        '02': 'February',
        '03': 'March',
        '04': 'April',
        '05': 'May',
        '06': 'June',
        '07': 'July',
        '08': 'August',
        '09': 'September',
        '10': 'October',
        '11': 'November',
        '12': 'December'
    }
    month = switcher.get(month, 'Invalid Month')
    date = month + " " + day + ", " + year
    time = (str)(hour) + ":" + min + " " + ampm
    return 'ETA: ' + date + " @ " + time

# Retrieves service issues
def get_car_service_issues(car_id):
    data = get_data(car_id)
    if ('serviceIssue' not in data):
        return 'There are no service issues!'
    else:
        return 'WARNING: You have a service issue. Your reference # is ' + data['serviceIssue']['referenceNumber'] + '.'

# Retrieves last completed event
def get_car_last_completed_event(car_id):
    data = get_data(car_id)
    last_completed_event = data['completedEvents'][0]

    if len(last_completed_event) is 0:
        return 'No events have been completed.'

    eta = last_completed_event['dateTime']

    year = eta[:4]
    month = eta[5:7]
    day = eta[8:10]
    hour = (int)(eta[11:13]) % 12
    min = eta[14:16]
    if (int)(eta[11:13]) > 12:
        ampm = "pm"
    else:
        ampm = "am"

    switcher = {
        '01': 'January',
        '02': 'February',
        '03': 'March',
        '04': 'April',
        '05': 'May',
        '06': 'June',
        '07': 'July',
        '08': 'August',
        '09': 'September',
        '10': 'October',
        '11': 'November',
        '12': 'December'
    }
    month = switcher.get(month, 'Invalid Month')
    date = month + " " + day + ", " + year
    time = (str)(hour) + ":" + min + " " + ampm
    last_event_time = date + " @ " + time

    return 'The last completed event was \"' + last_completed_event['name'] + '\", which occured on ' + last_event_time + '.'

# Retrieves next scheduled event
def get_car_next_scheduled_event(car_id):
    data = get_data(car_id)
    next_scheduled_event = data['scheduledEvents'][0]

    if len(next_scheduled_event) is 0:
        return 'No more events are scheduled. You\'ve reached your destination!'

    eta = next_scheduled_event['dateTime']

    year = eta[:4]
    month = eta[5:7]
    day = eta[8:10]
    hour = (int)(eta[11:13]) % 12
    min = eta[14:16]
    if (int)(eta[11:13]) > 12:
        ampm = "pm"
    else:
        ampm = "am"

    switcher = {
        '01': 'January',
        '02': 'February',
        '03': 'March',
        '04': 'April',
        '05': 'May',
        '06': 'June',
        '07': 'July',
        '08': 'August',
        '09': 'September',
        '10': 'October',
        '11': 'November',
        '12': 'December'
    }
    month = switcher.get(month, 'Invalid Month')
    date = month + " " + day + ", " + year
    time = (str)(hour) + ":" + min + " " + ampm
    next_event_time = date + " @ " + time
    location = next_scheduled_event['location']['city'] + ", " + next_scheduled_event['location']['state']

    return 'The next scheduled event is \"' + next_scheduled_event['name'] + '\", from ' + location + ' at ' + next_event_time + '.'