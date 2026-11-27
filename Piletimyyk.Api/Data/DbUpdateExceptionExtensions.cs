using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SQLitePCL;

namespace Piletimyyk.Api.Data;

public static class DbUpdateExceptionExtensions
{
    /* True when the save failed because a row would break a unique index
       (SQLite error 19 SQLITE_CONSTRAINT, extended code SQLITE_CONSTRAINT_UNIQUE).
       Other constraint failures, e.g. foreign keys, are not matched. */
    public static bool IsUniqueViolation(this DbUpdateException ex)
    {
        return ex.InnerException is SqliteException
        {
            SqliteErrorCode: raw.SQLITE_CONSTRAINT,
            SqliteExtendedErrorCode: raw.SQLITE_CONSTRAINT_UNIQUE
        };
    }
}
