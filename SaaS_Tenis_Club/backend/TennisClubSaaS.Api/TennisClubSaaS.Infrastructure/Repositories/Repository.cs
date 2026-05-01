using System.Collections.Concurrent;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Infrastructure.Data;

namespace TennisClubSaaS.Infrastructure.Repositories;

public class Repository<T>(TennisClubDbContext db) : IRepository<T> where T : class
{
    public IQueryable<T> Query() => db.Set<T>().AsQueryable();
    public IQueryable<T> QueryIgnoreFilters() => db.Set<T>().IgnoreQueryFilters().AsQueryable();
    public Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) => db.Set<T>().FindAsync([id], ct).AsTask();
    public Task AddAsync(T entity, CancellationToken ct = default) => db.Set<T>().AddAsync(entity, ct).AsTask();
    public void Update(T entity) => db.Set<T>().Update(entity);
    public void Remove(T entity) => db.Set<T>().Remove(entity);
    public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) => db.Set<T>().AnyAsync(predicate, ct);
}

public class UnitOfWork(TennisClubDbContext db) : IUnitOfWork
{
    private readonly ConcurrentDictionary<Type, object> repositories = new();
    public IRepository<T> Repository<T>() where T : class => (IRepository<T>)repositories.GetOrAdd(typeof(T), _ => new Repository<T>(db));
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
