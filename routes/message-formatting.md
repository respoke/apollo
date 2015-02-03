# Apollo message formats

Message contents are *stringified JSON*.

### Normal message

The same format is used for group and private messages. It expects stringified JSON
with a key `"text"`.

```json
{
    "message": "{ text: \"Hi there!\" }"

    /* other fields are required by Respoke */
}
```

### Meta messages

System level messages come over the system group `"apollo-system-messages"`. The system
group is technically configurable.

#### "is typing"

```json
{
    "message": "\"meta\": { \"type\": \"chatstate\", \"value\":\"composing\" }"
}
```

#### User account was created

```json
{
    "message": "\"meta\": { \"type\": \"newaccount\", \"value\":\"account_id\" }"
}
```

#### User account was deleted

```json
{
    "message": "\"meta\": { \"type\": \"removeaccount\", \"value\":\"account_id\" }"
}
```

#### Group was created

```json
{
    "message": "\"meta\": { \"type\": \"newgroup\", \"value\":\"group_id\" }"
}
```

#### Group was deleted

```json
{
    "message": "\"meta\": { \"type\": \"removegroup\", \"value\":\"group_id\" }"
}
```
